import axios from "axios";
import {CONTROL_NUMBER, URL_BASE} from "./systemConstants";


export function sendQrCode(qrCode: string) {
    axios.post(`${URL_BASE}/wip/whatsapp/register`, {
        action: 'QR_CODE',
        qrCode: qrCode,
        controlNumber: CONTROL_NUMBER,
    })
        .then(() => console.log('QRCODE ENVIADO!'))
        .catch(e => console.log(e.message))
}
