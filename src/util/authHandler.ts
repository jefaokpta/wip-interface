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
}

export function confirmAuthToApi(){
    axios.post(`${WIP_API_URL}/wip/whatsapp/register/confirmed/${CONTROL_NUMBER}`)
        .then(() => {
            console.log('AUTH CONFIRMADA')
        })
        .catch(err => {
            console.log('ERRO 🧨 AO CONFIRMAR AUTH', err.message)
        })
}
