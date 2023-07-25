import {downloadContentFromMessage, proto} from "@whiskeysockets/baileys";
import axios from "axios";
import {MessageData} from "../model/messageData";
import * as fs from "fs";
import IWebMessageInfo = proto.IWebMessageInfo;
import IMessage = proto.IMessage;
import {mediaDateFormater} from "../util/dateHandler";
import {MEDIA_FOLDER, WIP_API_URL} from "../util/systemConstants";

export function messageAnalisator(whatsappMessage: IWebMessageInfo) {
    const messageData = new MessageData(whatsappMessage)

    if(whatsappMessage.message?.audioMessage) {
        audioMessage(messageData, whatsappMessage)
            .then(() => sendMediaMessageToApi(messageData))
        return;
    }
    if(whatsappMessage.message?.documentMessage) {
        documentMessage(messageData, whatsappMessage.message, whatsappMessage.key.id!)
            .then(() => sendMediaMessageToApi(messageData))
        return;
    }
    if (whatsappMessage.message?.documentWithCaptionMessage) {
        documentMessage(messageData, whatsappMessage.message.documentWithCaptionMessage.message!, whatsappMessage.key.id!)
            .then(() => sendMediaMessageToApi(messageData))
        return;
    }
    if(whatsappMessage.message?.videoMessage) {
        videoMessage(messageData, whatsappMessage)
            .then(() => sendMediaMessageToApi(messageData))
        return;
    }
    if (whatsappMessage.message?.imageMessage) {
        imageMessage(messageData, whatsappMessage)
            .then(() => sendMediaMessageToApi(messageData))
        return
    }
    if(whatsappMessage.message?.contactMessage) {
        const name = whatsappMessage.message.contactMessage.displayName
        const vcardTel = whatsappMessage.message.contactMessage.vcard!.split('waid=')[1].split(':')[0]
        messageData.text = `CONTATO: ${name} - ${vcardTel}`
        sendMediaMessageToApi(messageData)
        return;
    }
    if(whatsappMessage.message?.contactsArrayMessage) {
        messageData.text = 'CONTATOS:\n'
        whatsappMessage.message.contactsArrayMessage.contacts?.forEach(contact => {
            const name = contact.displayName
            const vcardTel = contact.vcard!.split('waid=')[1].split(':')[0]
            messageData.text += `${name} - ${vcardTel}\n`
        } )
        sendTextMessageToApi(messageData)
        return
    }
    if (whatsappMessage.message?.conversation) {
        messageData.text = whatsappMessage.message?.conversation
        sendTextMessageToApi(messageData);
        return
    }
    if (whatsappMessage.message?.extendedTextMessage) {
        console.log('INFO: 📩 MENSAGEM DE TEXTO RECEBIDA', whatsappMessage.message.extendedTextMessage)
        messageData.text = whatsappMessage.message.extendedTextMessage.text
        messageData.quoteId = whatsappMessage.message.extendedTextMessage.contextInfo?.stanzaId
        messageData.quoteText = whatsappMessage.message.extendedTextMessage.contextInfo?.quotedMessage?.conversation
        sendTextMessageToApi(messageData);
        return
    }
    console.log('ERRO: 🤨 TIPO DE MENSAGEM DESCONHECIDA', whatsappMessage)
}

function sendTextMessageToApi(messageData: MessageData) {
    axios.post(`${WIP_API_URL}/wip/whatsapp/text-messages`, messageData)
        .catch(err => console.log('ERRO 🧨 AO ENVIAR MENSAGEM DE TEXTO', err.message))
}

function sendMediaMessageToApi(messageData: MessageData) {
    axios.post(`${WIP_API_URL}/wip/whatsapp/media-messages`, messageData)
        .catch(err => console.log('ERRO 🧨 AO ENVIAR MENSAGEM DE MÍDIA', err.message, messageData))
}

async function audioMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'AUDIO'
    messageData.isVoiceMessage = message.message?.audioMessage?.ptt
    const mimeTypeMedia = defineMimeTypeAudioMedia(message);
    const filePath  = `${MEDIA_FOLDER}/audio-${mediaDateFormater()}-${message.key.id}.${mimeTypeMedia}`
    messageData.mediaUrl = filePath.split('/').pop()
    const stream = await downloadContentFromMessage(message.message!.audioMessage!, 'audio')
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    fs.writeFileSync(filePath, buffer)
}

function defineMimeTypeAudioMedia(message: IWebMessageInfo){
    if(message.message?.audioMessage?.mimetype?.includes('ogg')){
        return 'ogg'
    } else if(message.message?.audioMessage?.mimetype?.includes('mp4')){
        return 'mp4'
    } else{
        return 'mpeg'
    }
}

async function documentMessage(messageData: MessageData, message: IMessage, messageId: string) {
    messageData.mediaMessage = true
    messageData.mediaType = 'DOCUMENT'
    const fileName = message.documentMessage!.fileName
    const fileExtension = fileName!!.split('.').pop()
    const filePath = `${MEDIA_FOLDER}/document-${mediaDateFormater()}-${messageId}.${fileExtension}`
    const stream = await downloadContentFromMessage(message.documentMessage!, 'document')
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    fs.writeFileSync(filePath, buffer)
    messageData.mediaUrl = filePath.split('/').pop()
    messageData.mediaFileLength = Number(message.documentMessage?.fileLength)
    messageData.pdfPageCount = message.documentMessage?.pageCount
    messageData.mediaFileName = fileName
    messageData.mediaCaption = message.documentMessage?.caption
}

async function videoMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'VIDEO'
    const filePath  = `${MEDIA_FOLDER}/video-${mediaDateFormater()}-${message.key.id}.mp4`
    messageData.mediaUrl = filePath.split('/').pop()
    const stream = await downloadContentFromMessage(message.message!.videoMessage!, 'video')
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    fs.writeFileSync(filePath, buffer)
    if (message.message?.videoMessage?.caption) {
        messageData.mediaCaption = message.message.videoMessage.caption
    }
}

async function imageMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'IMAGE'
    const mimeTypeMedia = message.message?.imageMessage?.mimetype?.split('/')[1]
    const filePath  = `${MEDIA_FOLDER}/image-${mediaDateFormater()}-${message.key.id}.${mimeTypeMedia}`
    const stream = await downloadContentFromMessage(message.message!.imageMessage!, 'image')
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    // save to file
    fs.writeFileSync(filePath, buffer)
    messageData.mediaUrl = filePath.split('/').pop()
    if(message.message?.imageMessage?.caption){
        messageData.mediaCaption = message.message.imageMessage.caption
    }
}
