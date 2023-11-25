import fs from "fs";
import axios from "axios";
import {restoreFolderFromS3, uploadFolderToS3} from "../s3/s3Service";
import {delay} from "@whiskeysockets/baileys";
import {CONTROL_NUMBER, WIP_API_URL} from "./systemConstants";

const authFolderPath = `./auth_info_multi-${CONTROL_NUMBER}`
export async function authFolderRestore() {
    if(!fs.existsSync(authFolderPath) || !fs.readdirSync(authFolderPath).length){
        await restoreFolderFromS3(authFolderPath.split('/').pop() + '/')
        console.log('⏱ COMPLETANDO RESTAURACAO DAS AUTHS...')
        await delay(3000)
    }
    return authFolderPath
}

export function authFolderDuplicate() {
    uploadFolderToS3(authFolderPath)
    confirmAuthToApi()
}

function confirmAuthToApi(){
    axios.post(`${WIP_API_URL}/wip/whatsapp/register/confirmed/${CONTROL_NUMBER}`)
        .then(() => {
            console.log('👍🏼 AUTH CONFIRMADA PARA API WIP')
        })
        .catch(err => {
            console.log('ERRO 🧨 AO CONFIRMAR AUTH', err.message)
        })
}

export function alertRegisterFailedToApi(){
    axios.post(`${WIP_API_URL}/wip/whatsapp/register/failed/${CONTROL_NUMBER}`)
        .then(() => {
            console.log('⚠️ API WIP INFORMADA DA FALHA NO REGISTRO')
        })
        .catch(err => {
            console.log('ERRO 🧨 AO INFORMAR A FALHA NO REGISTRO', err.message)
        })
}
