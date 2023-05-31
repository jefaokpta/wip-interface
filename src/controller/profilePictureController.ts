import express from "express";
import {Whatsapp} from "../model/whatsapp";

export const profilePicture = express()

profilePicture.get('/:whatsappNumber', (req, res) => {
    Whatsapp.sock.profilePictureUrl(req.params.whatsappNumber.concat('@s.whatsapp.net'))
        .then((data: any) => {
            res.send(data.toString())
        })
        .catch((error: any) => {
            console.log('🧨 ERRO AO BUSCAR FOTO DO CONTATO: ', error.message)
            res.sendStatus(500)
        })
})
