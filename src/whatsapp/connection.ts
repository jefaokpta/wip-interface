import makeWASocket, {
    DisconnectReason, proto,
    useMultiFileAuthState,
    WAVersion
} from "@whiskeysockets/baileys";
import {Boom} from "@hapi/boom";
import {alertRegisterFailedToApi, authFolderDuplicate, authFolderRestore} from "../util/authHandler";
import {sendQrCode} from "../util/qrCodeHandle";
import {Whatsapp} from "../model/whatsapp";
import axios from "axios";
import {messageAnalisator} from "./messageHandle";
import {CONTROL_NUMBER, WA_VERSION, WIP_API_URL} from "../util/systemConstants";
import {MessageData} from "../model/messageData";
import IWebMessageInfo = proto.IWebMessageInfo;


export const connectWhatsApp = async (waVersion: WAVersion) => {

    console.log(`WA VERSION PEGO DA LIB: ${waVersion.join('.')}`)
    console.log('WA VERSION ALEIJADO NO CODIGO: ', WA_VERSION)
    const waVersionChoosed = WA_VERSION.split('.').map(v => Number(v)) as WAVersion ?? waVersion
    console.log(`WA VERSION ESCOLHIDA: ${waVersionChoosed.join('.')}`)
    const { state, saveCreds } = await useMultiFileAuthState(await authFolderRestore())
    const sock = makeWASocket({
        version: waVersionChoosed,
        auth: state,
        printQRInTerminal: true,
        syncFullHistory: false,
        connectTimeoutMs: 300000,
        defaultQueryTimeoutMs: undefined,
        keepAliveIntervalMs: 60000,
    })

    /** connection state has been updated -- WS closed, opened, connecting etc. */
    sock.ev.on('connection.update', (update) => {
        const {connection, lastDisconnect, qr} = update
        if(qr != null) {
            sendQrCode(qr)
        }
        console.log('ESTADO DA CONEXAO - ', connection)
        switch (connection) {
            case 'open':
                Whatsapp.sock = sock
                console.log('SISTEMA LOGADO AO WHATSAPP COM SUCESSO 🚀 ')
                authFolderDuplicate()
                break
            case 'close':
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
                console.log('CONEXAO FECHADA POR ', lastDisconnect?.error, 'DATA-HORA ', lastDisconnect?.date, ', reconnecting ', shouldReconnect)
                if (shouldReconnect) {
                    console.log('RECONECTANDO...')
                    setTimeout(() => {
                        connectWhatsApp(waVersion)
                    }, 5000)
                    return
                } else{
                    console.log('SISTEMA DESLOGADO DO WHATSAPP')
                    console.log('!!! ATENCAO!!! AO LER QR CODE NAO PODE TER MENSAGENS PENDENTES')
                    console.log('ARQUIVO DE AUTENTICACAO DEVE SER DELETADO')
                    console.log('SISTEMA SERA DESLIGADO EM 5 SEGUNDOS')
                    alertRegisterFailedToApi()
                    setTimeout(() => {
                        process.exit(1)
                    }, 5000)
                }
                break
            case undefined:
                console.log('CONEXAO DESCONHECIDA DESCARTANDO...')
                return
        }
    })

    sock.ev.on('messages.upsert',  m => {
        const message  = m.messages[0]
        if(message.key.fromMe){
            setTimeout(possibleMsgFromMobileDevice, 30000, message)
            return;
        }
        console.log(message)
        if(message.key.remoteJid?.includes('@g.us')){
            console.log('MENSAGEM DE GRUPO, IGNORANDO E DESCARTANDO...')
            return
        }
        if(message.key.remoteJid === 'status@broadcast'){
            console.log('MENSAGEM status@broadcast RECEBIDA E DESCARTADA')
            return
        }
        if(message.message?.viewOnceMessage?.message?.buttonsMessage){
            console.log('MENSAGEM DE BOTOES RECEBIDA E DESCARTADA')
            return
        }
        if(message.message?.protocolMessage){
            console.log('MENSAGEM DE PROTOCOLO RECEBIDA E DESCARTADA')
            return
        }
        messageAnalisator(message)
            // .then(() => {
            //     if(!message.key.fromMe){
            //         setTimeout(() => {
            //             sock.readMessages([{
            //                 remoteJid: message.key.remoteJid!,
            //                 id: message.key.id!,
            //                 participant: message.key.participant!}])
            //                 .then(() => {
            //                 }).catch(err => console.log('ERRO AO MARCAR MENSAGEM COMO LIDA', err))
            //         }, 5000)
            //     }
            // }, err => console.log('ERRO AO ENVIAR MSG PRA API JAVA', err.message))
    })

    /** ATUALIZACAO DE STATUS DE MSG ENVIADA */
    sock.ev.on('messages.update', m => {
        axios.post(`${WIP_API_URL}/wip/whatsapp/message-status`, {
            messageId: m[0].key.id,
            controlNumber: CONTROL_NUMBER,
            whatsapp: m[0].key.remoteJid!.includes(':') ? m[0].key.remoteJid!.split(':')[0] : m[0].key.remoteJid!.split('@')[0],
            timestampInSeconds: 0,
            messageStatus: m[0].update.status,
            fromMe: m[0].key.fromMe
        }).catch(err => console.log('ERRO 🧨 AO ATUALIZAR STATUS DE MENSAGEM', err.message))
    })

    /** ATUALIZA ARQUIVO AUTHS */
    sock.ev.on('creds.update',  () => {
        console.log('ATUALIZANDO CREDS')
        saveCreds().then(() => authFolderDuplicate())

    })

    /** EVENTOS DISPONIVEIS - INUTEIS POR ENQUANTO */

    sock.ev.on('message-receipt.update', m => {
        console.log('RECEBENDO message-receipt.update')
        console.log(m)
    })
    /** INUTIL POR ENQUANTO
     sock.ev.on('presence.update', m => {
        console.log('RECEBENDO presence.update')
        console.log(m)
    })
     */
    sock.ev.on('chats.update', m => {
        console.log('RECEBENDO chats.update')
        console.log(m[0])
    })
    sock.ev.on('contacts.upsert', contacts => {
        console.log(`RECEBENDO contacts.upsert ${contacts.length}`)
        axios.post(`${WIP_API_URL}/wip/public/contacts/wa-contacts/${CONTROL_NUMBER}`, contacts)
    })
}

function possibleMsgFromMobileDevice(whatsappMessage: IWebMessageInfo) {
    const messageData = new MessageData(whatsappMessage)
    messageData.timestampInSeconds = new Date(messageData.timestampInSeconds as number).getTime()
    if (whatsappMessage.message?.conversation) {
        console.log('INFO: 📩 ENVIANDO CONVERSATION PRA API', whatsappMessage.message.conversation)
        messageData.text = whatsappMessage.message?.conversation
        sendMobileTextMessageToApi(messageData);
        return
    }
    if (whatsappMessage.message?.extendedTextMessage) {
        console.log('INFO: 📩 ENVIANDO EXTENDED TEXT PRA API', whatsappMessage.message.extendedTextMessage)
        messageData.text = whatsappMessage.message.extendedTextMessage.text
        messageData.quoteId = whatsappMessage.message.extendedTextMessage.contextInfo?.stanzaId
        messageData.quoteText = whatsappMessage.message.extendedTextMessage.contextInfo?.quotedMessage?.conversation
        sendMobileTextMessageToApi(messageData);
    }
}
function sendMobileTextMessageToApi(messageData: MessageData) {
    console.log('⬅️ ENVIADO MENSAGEM DE TEXTO DO DEVICE', messageData)
    axios.post(`${WIP_API_URL}/wip/whatsapp/text-messages/mobile`, messageData)
        .catch(err => console.log('ERRO 🧨 AO ENVIAR MENSAGEM DE TEXTO', err.message))
}