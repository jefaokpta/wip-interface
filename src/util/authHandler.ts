import fs from "fs";
import {mediaFolder, urlBase} from "./staticVar";
import axios from "axios";

const controlNumber = process.env.CONTROL_NUMBER || '100023'
let authFolderPath = `./auth_info_multi-${controlNumber}`
let authFolderPathBkp = `${mediaFolder}/auths/auth_info_multi-${controlNumber}`

export function authFolderRestore() {
    if (!fs.existsSync(authFolderPath)) {
        try {
            fs.cpSync(authFolderPathBkp, authFolderPath, {recursive: true})
            console.log('INFO: 👍🏼 AUTH FOLDER RESTAURADO COM SUCESSO.')
        } catch (e) {
            console.log('ERRO: 🧨 AO RESTAURAR AUTH FOLDER ', e)
        }
    }
    return authFolderPath
}

export function authFolderDuplicate() {
    fs.cp(authFolderPath, authFolderPathBkp, {recursive: true, force: true}, (err) => {
        if (err) console.log('ERRO: AO DUPLICAR AUTH FOLDER', err)
    });
}

export function deleteAuthFolder() {
    fs.rm(authFolderPath, {recursive: true}, (err) => {
        if (err) console.log('ERRO: AO DELETAR AUTH FOLDER', err)
        else console.log('INFO: AUTH FOLDER DELETADO.');
    })
    fs.rm(authFolderPathBkp, {recursive: true}, (err) => {
        if (err) console.log('ERRO: AO DELETAR AUTH FOLDER', err)
        else console.log('INFO: AUTH FOLDER DELETADO.');
    })
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
