import {mediaFolder} from "../util/staticVar";
import {MessageData} from "../model/messageData";
import {Whatsapp} from "../model/whatsapp";
import {mediaDateFormater} from "../util/dateHandler";

const execSync = require('child_process').execSync;
const fs = require('fs')

const UPLOAD_FOLDER = `${mediaFolder}/uploads`
const MEDIA_FOLDER = `${mediaFolder}`

export async function sendTxt(message: MessageData) {
    const messageSended = await Whatsapp.sock.sendMessage(message.whatsapp!.concat('@s.whatsapp.net'), {text: message.text!})
    message.messageId = messageSended.key.id
    message.timestampInSeconds = Number(messageSended.messageTimestamp)
    message.messageStatus = messageSended.status || 2
    return message
}

export function sendChatbot(message: MessageData, invalidOption: boolean) {
    const chatbot = message.chatbot!!
    const options = chatbot.options.map((option) => `${option.option} - ${option.department}`).join('\n')
    const text = invalidOption ? `${chatbot.invalidOption}\n\n${options}` : `${chatbot.initialMessage}\n\n${options}`
    Whatsapp.sock.sendMessage(message.whatsapp!.concat('@s.whatsapp.net'), {text: text})
}

export function checkIfIsOnWhatsapp(telNumber: string): Promise<boolean[]> {
    return Whatsapp.sock.onWhatsApp(telNumber).map((isOnWhatsapp: boolean) => isOnWhatsapp)
}

export async function blockUnblockContact(blockData: { remoteJid: string, action: 'block' | 'unblock' }) {
    await Whatsapp.sock.updateBlockStatus(blockData.remoteJid, blockData.action)
}

export function sendSurveyMessage(message: MessageData) {
    const fakeButtonMessage = `${message.text} \n 3 => 😃 \n 2 => 😐 \n 1 => 😩`
    Whatsapp.sock.sendMessage (message.whatsapp!.concat('@s.whatsapp.net'), {text: fakeButtonMessage})
        .catch((error: any) => console.log('ERRO AO ENVIAR SURVEY ',error))
}

export async function sendMediaMessage(message: MessageData) {
    const messageSended = await Whatsapp.sock.sendMessage(message.whatsapp!.concat('@s.whatsapp.net'), messageOptions(message))
    message.messageId = messageSended.key.id
    message.timestampInSeconds = Number(messageSended.messageTimestamp)
    message.messageStatus = messageSended.status || 2
    message.mediaUrl = `${mediaDateFormater()}-${message.controlNumber}-${message.mediaType?.toLowerCase()}-${messageSended.key.id}.${message.mediaFileName?.split('.').pop()}`
    fs.rename(`${UPLOAD_FOLDER}/${message.mediaFileName}`, `${MEDIA_FOLDER}/${message.mediaUrl}`, (err: any) => {
        if (err) console.log('ERRO 🧨 AO MOVER MEDIA ENVIADA ', err)
    })
    if(message.isVoiceMessage) {
        const m4aFile = `${UPLOAD_FOLDER}/${message.mediaFileName!.split('.')[0]}.m4a`
        fs.rm(m4aFile, (err: any) => {
            if (err) console.log('ERRO 🧨 AO REMOVER AUDIO CONVERTIDO M4A ', err)
        })
    }
    return message
}

function messageOptions(message: MessageData) {
    switch (message.mediaType) {
        case 'IMAGE':
            return {
                image: {url: `${UPLOAD_FOLDER}/${message.mediaFileName}`},
                caption: message.mediaCaption,
                mimetype: imageMimeType(message.mediaFileName!).mimeType,
                jpegThumbnail: undefined,
            }
        case 'DOCUMENT':
            return {
                document: {url: `${UPLOAD_FOLDER}/${message.mediaFileName}`},
                caption: message.mediaCaption,
                mimetype: 'application/pdf',
                fileName: message.mediaFileName,
            }
        case 'VIDEO':
            return {
                video: {url: `${UPLOAD_FOLDER}/${message.mediaFileName}`},
                caption: message.mediaCaption,
                gifPlayback: undefined,
                jpegThumbnail: undefined,
            }
        case 'AUDIO':
            let audioFile = `${UPLOAD_FOLDER}/${message.mediaFileName}`
            if (message.isVoiceMessage) {
                audioFile = convertAudioToM4a(message.mediaFileName!)
            }
            return {
                audio: {url: audioFile},
                mimetype: 'audio/mp4',
                ptt: message.isVoiceMessage,
                seconds: undefined
            }
        default:
            return {
                document: {url: `${UPLOAD_FOLDER}/${message.mediaFileName}`},
                mimetype: 'application/pdf',
                fileName: message.mediaFileName,
            }
    }
}

function convertAudioToM4a(filePath: string) {
    const file = `${UPLOAD_FOLDER}/${filePath}`
    const fileName = filePath.split('.')[0]
    const m4aFile = `${UPLOAD_FOLDER}/${fileName}.m4a`
    const command = `ffmpeg -i ${file} -vn -ar 44100 -ac 1 ${m4aFile} -y`
    try {
        execSync(command)
        console.log('AUDIO CONVERTIDO COM SUCESSO')
        return m4aFile
    } catch (error) {
        console.log('ERRO AO CONVERTER AUDIO: ', error)
        return file
    }
}

function imageMimeType(name: string) {
    if(name.substring(name.lastIndexOf('.')) === '.png'){
        return {
            messageType: 'image',
            mimeType: 'image/png'
        }
    }
    return {
        messageType: 'image',
        mimeType: 'image/jpeg'
    }
}
