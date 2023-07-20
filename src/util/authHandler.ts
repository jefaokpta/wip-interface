import fs from "fs";
import {urlBase} from "./staticVar";
import axios from "axios";
import {restoreFolderFromS3, uploadFolderToS3} from "../s3/s3Service";
import {delay} from "@whiskeysockets/baileys";

const controlNumber = process.env.CONTROL_NUMBER ?? '100023'
const authFolderPath = `./auth_info_multi-${controlNumber}`
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
    axios.post(`${urlBase}/api/register/auth/${controlNumber}`)
        .then(() => {
            console.log('AUTH CONFIRMADA')
        })
        .catch(err => {
            console.log('ERRO 🧨 AO CONFIRMAR AUTH', err.message)
        })
}
