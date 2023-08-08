import {MessageData} from "../model/messageData";
import {Whatsapp} from "../model/whatsapp";
import {mediaDateFormater} from "../util/dateHandler";
import {UPLOAD_FOLDER_URL} from "../util/systemConstants";
import {moveObjectThroughS3} from "../s3/s3Service";


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
    return Whatsapp.sock.onWhatsApp(telNumber.concat('@s.whatsapp.net')).map((isOnWhatsapp: boolean) => isOnWhatsapp)
}

export async function blockUnblockContact(blockData: { remoteJid: string, action: 'block' | 'unblock' }) {
    await Whatsapp.sock.updateBlockStatus(blockData.remoteJid.concat('@s.whatsapp.net'), blockData.action)
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
    message.mediaUrl = `${message.mediaType?.toLowerCase()}-${mediaDateFormater()}-${messageSended.key.id}.${message.mediaFileName!.split('.').pop()}`
    moveObjectThroughS3(message.mediaFileName!, message.mediaUrl)
    return message
}

function messageOptions(message: MessageData) {
    switch (message.mediaType) {
        case 'IMAGE':
            return {
                image: {url: `${UPLOAD_FOLDER_URL}/${message.mediaFileName}`},
                caption: message.mediaCaption,
                mimetype: imageMimeType(message.mediaFileName!).mimeType,
                jpegThumbnail: undefined,
            }
        case 'DOCUMENT':
            return {
                document: {url: `${UPLOAD_FOLDER_URL}/${message.mediaFileName}`},
                caption: message.mediaCaption,
                mimetype: 'application/pdf',
                fileName: message.mediaFileName,
            }
        case 'VIDEO':
            return {
                video: {url: `${UPLOAD_FOLDER_URL}/${message.mediaFileName}`},
                caption: message.mediaCaption,
                gifPlayback: undefined,
                jpegThumbnail: undefined,
            }
        case 'AUDIO':
            return {
                audio: {url: `${UPLOAD_FOLDER_URL}/${message.mediaFileName}`},
                mimetype: 'audio/mp4',
                ptt: message.isVoiceMessage,
                seconds: undefined
            }
        default:
            return {
                document: {url: `${UPLOAD_FOLDER_URL}/${message.mediaFileName}`},
                mimetype: 'application/pdf',
                fileName: message.mediaFileName,
            }
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
