import {proto} from "@adiwajshing/baileys";
import IMessage = proto.IMessage;
import IMessageKey = proto.IMessageKey;
import IWebMessageInfo = proto.IWebMessageInfo;
import {Chatbot} from "./chatbot";

export class MessageData {
    messageId: string | undefined | null
    controlNumber: number | undefined
    whatsapp: string | undefined | null
    timestampInSeconds: number | Long | null | undefined
    messageStatus: number
    fromMe: boolean
    instanceId: string | undefined
    text: string | undefined | null
    mediaMessage: boolean
    mediaType: string | undefined
    mediaUrl: string | undefined
    mediaFileLength: number | Long | null | undefined
    mediaPageCount: number | null | undefined
    mediaFileTitle: string | null | undefined
    mediaCaption: string | null | undefined
    chatbot: Chatbot | null | undefined

    constructor(message: IWebMessageInfo) {
        this.messageId = message.key.id
        this.controlNumber = Number(process.env.CONTROL_NUMBER) || 100023
        this.whatsapp = message.key.remoteJid?.split('@')[0]
        this.timestampInSeconds = message.messageTimestamp
        this.messageStatus = message.status || 1
        this.fromMe = message.key.fromMe || false
        this.instanceId = process.env.API_PORT || "3007"
        this.mediaMessage = false
    }

}
