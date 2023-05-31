import express from 'express'
import {fetchLatestBaileysVersion} from "@adiwajshing/baileys";
import {connectWhatsApp} from "./whatsapp/connection";
import {
    blockContact,
    buttonMessageController,
    chatbotController,
    isOnWhatsapp,
    messageController
} from "./controller/messageController";
import {profilePicture} from "./controller/profilePictureController";


const port = process.env.PORT || 3007

const router = express()
router.use(express.json())

fetchLatestBaileysVersion()
    .then(({version, isLatest}) => {
        connectWhatsApp(version)
    })

router.use('/whatsapp/messages/text', messageController)
router.use('/whatsapp/messages/chatbot', chatbotController)
router.use('/whatsapp/messages/survey', buttonMessageController)
router.use('/whatsapp/profile/picture', profilePicture)
router.use('/whatsapp/contacts/block', blockContact)
router.use('/whatsapp/contacts/is-on-whats', isOnWhatsapp)

router.listen(port, () => {
    console.log(`Server iniciou na porta ${port}! 🚀`);
});