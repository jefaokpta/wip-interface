import express from "express";
import {
    blockUnblockContact,
    checkIfIsOnWhatsapp,
    sendButtonsMessage, sendChatbot,
    sendMediaMessage,
    sendTxt
} from "../whatsapp/messageSender";
import {MessageData} from "../model/messageData";


export const messageController = express()
export const chatbotController = express()
export const buttonMessageController = express()
export const blockContact = express()
export const isOnWhatsapp = express()

messageController.post('/', async (req, res) => {
    const message = JSON.parse(req.body) as MessageData
    if(message.mediaMessage) {
        res.send(await sendMediaMessage(message))
        return
    }
    res.send(await sendTxt(message))
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
