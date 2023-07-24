import axios from "axios";
import {urlBase} from "./staticVar";


export function sendQrCode(qrCode: string) {
    axios.post(`${urlBase}/wip/whatsapp/register`, {
        action: 'QR_CODE',
        qrCode: qrCode,
        controlNumber: process.env.CONTROL_NUMBER ?? 100023,
    })
        .then(() => console.log('QRCODE ENVIADO!'))
        .catch(e => console.log(e.message))
}
