import {downloadContentFromMessage, MediaType, proto} from "@whiskeysockets/baileys";
import axios from "axios";
import {MessageData} from "../model/messageData";
import IWebMessageInfo = proto.IWebMessageInfo;
import {mediaDateFormater} from "../util/dateHandler";
import {WIP_API_URL} from "../util/systemConstants";
import {putObjectInS3} from "../s3/s3Service";
import IImageMessage = proto.Message.IImageMessage;
import IVideoMessage = proto.Message.IVideoMessage;
import IAudioMessage = proto.Message.IAudioMessage;
import IDocumentMessage = proto.Message.IDocumentMessage;
import IMessage = proto.IMessage;

type DownloadTypes = IImageMessage | IVideoMessage | IAudioMessage | IDocumentMessage

export function messageAnalisator(whatsappMessage: IWebMessageInfo) {
    const messageData = new MessageData(whatsappMessage)

    if(whatsappMessage.message?.audioMessage) {
        audioMessage(messageData, whatsappMessage)
        sendMediaMessageToApi(messageData)
        return;
    }
    if(whatsappMessage.message?.documentMessage) {
        documentMessage(messageData, whatsappMessage.message, whatsappMessage.key.id!)
        sendMediaMessageToApi(messageData)
        return;
    }
    if (whatsappMessage.message?.documentWithCaptionMessage) {
        console.log(whatsappMessage.message)
        documentMessage(messageData, whatsappMessage.message.documentWithCaptionMessage.message!, whatsappMessage.key.id!)
        console.log(messageData)
        sendMediaMessageToApi(messageData)
        return;
    }
    if(whatsappMessage.message?.videoMessage) {
        videoMessage(messageData, whatsappMessage)
        sendMediaMessageToApi(messageData)
        return;
    }
    if (whatsappMessage.message?.imageMessage) {
        imageMessage(messageData, whatsappMessage)
        sendMediaMessageToApi(messageData)
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

function audioMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'AUDIO'
    messageData.isVoiceMessage = message.message?.audioMessage?.ptt
    const mimeTypeMedia = defineMimeTypeAudioMedia(message);
    messageData.mediaUrl  = `audio-${mediaDateFormater()}-${message.key.id}.${mimeTypeMedia}`
    downloadAndSaveMedia(message.message!.audioMessage!, messageData, 'audio');
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

function documentMessage(messageData: MessageData, message: IMessage, messageId: string) {
    messageData.mediaMessage = true
    messageData.mediaType = 'DOCUMENT'
    const fileName = message.documentMessage!.fileName
    const fileExtension = fileName!!.split('.').pop()
    messageData.mediaUrl = `document-${mediaDateFormater()}-${messageId}.${fileExtension}`
    messageData.mediaFileLength = Number(message.documentMessage?.fileLength)
    messageData.pdfPageCount = message.documentMessage?.pageCount
    messageData.mediaFileName = fileName
    messageData.mediaCaption = message.documentMessage?.caption
    downloadAndSaveMedia(message.documentMessage!, messageData, 'document');
}

function videoMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'VIDEO'
    messageData.mediaUrl  = `video-${mediaDateFormater()}-${message.key.id}.mp4`
    if (message.message?.videoMessage?.caption) {
        messageData.mediaCaption = message.message.videoMessage.caption
    }
    downloadAndSaveMedia(message.message?.videoMessage!, messageData, 'video');
}

function imageMessage(messageData: MessageData, message: IWebMessageInfo){
    messageData.mediaMessage = true
    messageData.mediaType = 'IMAGE'
    const mimeTypeMedia = message.message?.imageMessage?.mimetype?.split('/')[1]
    messageData.mediaUrl  = `image-${mediaDateFormater()}-${message.key.id}.${mimeTypeMedia}`
    if(message.message?.imageMessage?.caption){
        messageData.mediaCaption = message.message.imageMessage.caption
    }
    downloadAndSaveMedia(message.message!.imageMessage!, messageData, 'image');
}

function downloadAndSaveMedia(message: DownloadTypes, messageData: MessageData, mediaType: MediaType) {
    downloadContentFromMessage(message, mediaType)
        .then(async stream => {
            let buffer = Buffer.from([])
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            putObjectInS3(buffer, messageData.mediaUrl!)
        })
}
