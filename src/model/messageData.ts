import {proto} from "@adiwajshing/baileys";
import IMessage = proto.IMessage;
import IMessageKey = proto.IMessageKey;
import IWebMessageInfo = proto.IWebMessageInfo;
import {Chatbot} from "./chatbot";

type StringNullable = string | null | undefined
export class MessageData {
    messageId: StringNullable
    controlNumber: number | undefined
    whatsapp: StringNullable
    timestampInSeconds: number | Long | null | undefined
    instanceId: string | undefined
    fromMe: boolean
    text: StringNullable
    messageStatus: number
    mediaMessage: boolean
    mediaType: string | undefined
    mediaUrl: string | undefined
    mediaFileLength: number | Long | null | undefined
    pdfPageCount: number | null | undefined
    mediaFileTitle: StringNullable
    mediaCaption: StringNullable
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
