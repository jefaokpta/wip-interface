import express from "express";
import {
    blockUnblockContact,
    checkIfIsOnWhatsapp,
    sendButtonsMessage, sendChatbot,
    sendMediaMessage,
    sendTxt
} from "../whatsapp/messageSender";


export const messageController = express()
export const chatbotController = express()
export const buttonMessageController = express()
export const blockContact = express()
export const isOnWhatsapp = express()

messageController.post('/', async (req, res) => {
    if(req.body.mediaMessage) {
        res.send(await sendMediaMessage(req.body))
        return
    }
    res.send(await sendTxt(req.body))
})

chatbotController.post('/', (req, res) => {
    sendChatbot(req.body, req.query.invalidOption === 'true')
    res.sendStatus(200)
})

isOnWhatsapp.post('/', (req, res) => {
    checkIfIsOnWhatsapp(req.body.telNumber)
        .then((isOn) => res.send(isOn.length > 0))
        .catch((error) => res.send(error))
})

blockContact.post('/', (req, res) => {
    blockUnblockContact(req.body)
    res.status(200).send()
})

buttonMessageController.post('/', (req, res) => {
    sendButtonsMessage(req.body)
    res.sendStatus(200)
})
