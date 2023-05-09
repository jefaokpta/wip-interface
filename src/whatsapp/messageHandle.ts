import {downloadContentFromMessage, proto} from "@adiwajshing/baileys";
import axios from "axios";
import {mediaFolder, urlBase} from "../util/staticVar";
import {MessageData} from "../model/messageData";
import * as fs from "fs";
import IWebMessageInfo = proto.IWebMessageInfo;
import IMessage = proto.IMessage;

export function messageAnalisator(whatsappMessage: IWebMessageInfo) {
    const messageData = new MessageData(whatsappMessage)

    if(whatsappMessage.message?.audioMessage) {
        audioMessage(messageData, whatsappMessage)
            .then(() => sendMediaMessageToApi(messageData))
        return;
    }
    if(whatsappMessage.message?.documentMessage) {
        documentMessage(messageData, whatsappMessage)
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
        console.log(';;;;;;;;;;;;; RECEBIDO CONTATO')
        const vcardCuted = whatsappMessage.message.contactMessage.vcard!!.split('waid=')[1];
        return;
    }
    if(whatsappMessage.message?.contactsArrayMessage) {
        console.log(';;;;;;;;;;;;; RECEBIDO ARRAY CONTATOS')
        return
    }
    if (whatsappMessage.message?.conversation) {
        messageData.text = whatsappMessage.message?.conversation
        axios.post(`${urlBase}/wip/whatsapp/text-messages`, messageData)
            .catch(err => console.log('ERRO 🧨 AO ENVIAR MENSAGEM DE TEXTO', err.message))
        return
    }
    console.log('ERRO: 🤨 TIPO DE MENSAGEM DESCONHECIDA', whatsappMessage)
}

function sendMediaMessageToApi(messageData: MessageData) {
    axios.post(`${urlBase}/wip/whatsapp/media-messages`, messageData)
        .catch(err => console.log('ERRO 🧨 AO ENVIAR MENSAGEM DE MÍDIA', err.message))
}

function getDiffMinutes(surveyTime: Date): number {
    const diff = new Date().getTime() - surveyTime.getTime();
    return Math.floor(diff / (1000 * 60));
}

function fakeButtonMessageResponse(message: IWebMessageInfo){
    const responseText = message.message?.conversation || message.message?.extendedTextMessage?.text || 0
    let responseNumber = 0
    if (typeof responseText === "string") {
        responseNumber = parseInt(responseText)
        if(isNaN(responseNumber)){
            responseNumber = 0
        }
    }
    if(responseNumber > 3) {
        responseNumber = 0
    }
    console.log(';;;;;;;;;;;;; RESPONSE NUMBER  ' + responseNumber)
const fakeButtonResponse: IMessage ={
        buttonsResponseMessage: {
            selectedButtonId: responseNumber.toString(),
        }
}
    return fakeButtonResponse
}

async function audioMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'AUDIO'
    const mimeTypeMedia = defineMimeTypeAudioMedia(message);
    const filePath  = `${mediaFolder}/audio-${message.key.id}.${mimeTypeMedia}`
    messageData.mediaUrl = filePath
    // @ts-ignore
    const stream = await downloadContentFromMessage(message.message!!.audioMessage, 'audio')
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    // save to file
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

async function documentMessage(messageData: MessageData, message: IWebMessageInfo) {
    messageData.mediaMessage = true
    messageData.mediaType = 'DOCUMENT'
    const fileTitle = message.message!!.documentMessage!!.fileName
    const fileExtension = fileTitle!!.substring(fileTitle!!.lastIndexOf('.'))
    const filePath = `${mediaFolder}/document-${message.key.id}${fileExtension}`
    // @ts-ignore
    const stream = await downloadContentFromMessage(message.message!!.documentMessage, 'document')
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    // save to file
    fs.writeFileSync(filePath, buffer)
    messageData.mediaUrl = filePath
    messageData.mediaFileLength = message.message?.documentMessage?.fileLength
    messageData.pdfPageCount = message.message?.documentMessage?.pageCount
    messageData.mediaFileTitle = fileTitle
}

async function videoMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'VIDEO'
    const filePath  = `${mediaFolder}/video-${message.key.id}.mp4`
    messageData.mediaUrl = filePath
    // @ts-ignore
    const stream = await downloadContentFromMessage(message.message!!.videoMessage, 'video')
    let buffer = Buffer.from([])
    for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    // save to file
    fs.writeFileSync(filePath, buffer)
    if (message.message?.videoMessage?.caption) {
        messageData.mediaCaption = message.message.videoMessage.caption
    }
}

async function imageMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'IMAGE'
    const mimeTypeMedia = message.message?.imageMessage?.mimetype?.split('/')[1]
    const filePath  = `${mediaFolder}/image-${message.key.id}.${mimeTypeMedia}`
    // @ts-ignore
    const stream = await downloadContentFromMessage(message.message!!.imageMessage, 'image')
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
