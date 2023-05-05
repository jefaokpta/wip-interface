import axios from "axios";
import {urlBase} from "./staticVar";


export function sendQrCode(qrCode: string) {
    axios.post(`${urlBase}/api/register`, {
        code: qrCode,
        id: process.env.COMPANY || 18
    })
        .then(() => console.log('QRCODE ENVIADO!'))
        .catch(e => console.log(e.message))
}
