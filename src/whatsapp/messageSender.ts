import util from "util";
import {mediaFolder} from "../util/staticVar";
import {MessageData} from "../model/messageData";
import {Whatsapp} from "../model/whatsapp";


const exec =  util.promisify(require("child_process").exec);

const FILE_URL = `${mediaFolder}/uploads`

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

export function sendButtonsMessage(message: MessageData) {
    // send a buttons message!
    // const buttons = [ // desativado por enquanto até resolver o problema do botão de opção
    //     {buttonId: '3', buttonText: {displayText: '😃'}, type: 1},
    //     {buttonId: '2', buttonText: {displayText: '😐'}, type: 1},
    //     {buttonId: '1', buttonText: {displayText: '😩'}, type: 1}
    // ]
    /**const buttonMediaMessage = { // this is a BUTTON media message
        image: {url: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg'},
        caption: message.btnText,
        footer: 'msg de foooter',
        buttons: buttons,
        headerType: 4
    }*/
    // const buttonMessage = { // desativado por enquanto até resolver o problema do botão de opção
    //     text: message.btnText!!,
    //     footer: message.btnFooterText,
    //     buttons: buttons,
    //     headerType: 1
    // }
    // sock.sendMessage (message.remoteJid, buttonMessage)
    const fakeButtonMessage = `${message.text} \n 3 => 😃 \n 2 => 😐 \n 1 => 😩`
    Whatsapp.sock.sendMessage (message.whatsapp!, {text: fakeButtonMessage})
        .catch((error: any) => console.log('ERRO AO ENVIAR BOTOES ',error))
}

export async function sendMediaMessage(message: MessageData) {
    Whatsapp.sock.sendMessage(message.whatsapp!.concat('@s.whatsapp.net'), await messageOptions(fileUpload))
}

async function messageOptions(message: MessageData) {
    switch (message.mediaType) {
        case 'IMAGE':
            return {
                image: {url: `${FILE_URL}/${message.mediaFileTitle}`},
                caption: message.mediaCaption,
                mimetype: imageMimeType(message.mediaFileTitle!).mimeType,
                jpegThumbnail: undefined,
            }
        case 'DOCUMENT':
            return {
                document: {url: `${FILE_URL}/${fileUpload.filePath}`},
                mimetype: 'application/pdf',
                fileName: fileUpload.filePath,
            }
        case 'VIDEO':
            return {
                video: {url: `${FILE_URL}/${fileUpload.filePath}`},
                caption: fileUpload.caption,
                gifPlayback: undefined,
                jpegThumbnail: undefined,
            }
        case 'AUDIO':
            let audioFile = `${FILE_URL}/${fileUpload.filePath}`
            if (fileUpload.ptt) {
                audioFile = await convertAudioToM4a(fileUpload.filePath)
            }
            return {
                audio: {url: audioFile},
                mimetype: 'audio/mp4',
                ptt: fileUpload.ptt,
                seconds: undefined
            }
        default:
            return {
                document: {url: `${FILE_URL}/${fileUpload.filePath}`},
                mimetype: 'application/pdf',
                fileName: fileUpload.filePath,
            }
    }
}

async function convertAudioToM4a(filePath: string) {
    const file = `${FILE_URL}/${filePath}`
    const fileName = filePath.split('.')[0]
    const m4aFile = `${FILE_URL}/${fileName}.m4a`
    const command = `ffmpeg -i ${file} -vn -ar 44100 -ac 1 ${m4aFile} -y`
    try {
        const {error, stdout, stderr} = await exec(command)
        if (error) {
            console.log('ERRO AO CONVERTER AUDIO: ', error)
            return file
        }
        console.log('AUDIO M4A CONVERTIDO COM SUCESSO: ', m4aFile)
        return m4aFile
    } catch (errorTry) {
        console.log('ERRO AO CONVERTER AUDIO: ', errorTry)
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
