import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WAVersion
} from "@adiwajshing/baileys";
import {Boom} from "@hapi/boom";
import {authFolderDuplicate, authFolderRestore, confirmAuthToApi, deleteAuthFolder} from "../util/authHandler";
import {sendQrCode} from "../util/qrCodeHandle";
import {Whatsapp} from "../model/whatsapp";
import axios from "axios";
import {urlBase} from "../util/staticVar";
import {messageAnalisator} from "./messageHandle";


export const connectWhatsApp = async (waVersion: WAVersion) => {

    console.log(`USANDO WA v${waVersion.join('.')}`)
    const { state, saveCreds } = await useMultiFileAuthState(authFolderRestore())
    const sock = makeWASocket({
        version: waVersion,
        auth: state,
        printQRInTerminal: true,
        syncFullHistory: false,
    })

    /** connection state has been updated -- WS closed, opened, connecting etc. */
    sock.ev.on('connection.update', (update) => {
        const {connection, lastDisconnect, qr} = update
        if(qr != null) {
            sendQrCode(qr)
        }
        console.log('ESTADO DA CONEXAO ', connection)
        switch (connection) {
            case 'open':
                Whatsapp.sock = sock
                console.log('SISTEMA LOGADO AO WHATSAPP 👍🏼 ')
                authFolderDuplicate()
                confirmAuthToApi()
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
                    deleteAuthFolder()
                    console.log('ARQUIVO DE AUTENTICACAO DELETADO')
                    console.log('SISTEMA SERA DESLIGADO EM 5 SEGUNDOS')
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
        if(message.key.fromMe) return;
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
        return axios.post(`${urlBase}/api/messages/status/update`, {
            remoteJid: m[0].key.remoteJid,
            id: m[0].key.id,
            status: m[0].update.status,
            companyId: process.env.COMPANY || '18'
        })
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
        console.log(m)
    })
    sock.ev.on('contacts.upsert', m => {
        console.log('RECEBENDO contacts.upsert')
        console.log(m)
    })
}

