import axios from "axios";
import {CONTROL_NUMBER, WIP_API_URL} from "./systemConstants";


export function sendQrCode(qrCode: string) {
    axios.post(`${WIP_API_URL}/wip/whatsapp/register`, {
        action: 'QR_CODE',
        qrCode: qrCode,
        controlNumber: CONTROL_NUMBER,
    })
        .then(() => console.log('QRCODE ENVIADO!'))
        .catch(e => console.log(e.message))
}
