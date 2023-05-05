import express from "express";
import {Whatsapp} from "../model/whatsapp";

export const profilePicture = express()

profilePicture.get('/:remoteJid', (req, res) => {
    Whatsapp.sock.profilePictureUrl(req.params.remoteJid)
        .then((data: any) => {
            //console.log(data)
            res.json({picture: data.toString()})
        })
        .catch((error: any) => {
            console.log(error.message)
            res.status(404).json({
                errorMessage: error.message
            })
        })
})
