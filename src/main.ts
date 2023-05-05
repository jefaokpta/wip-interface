import express from 'express'
import {fetchLatestBaileysVersion} from "@adiwajshing/baileys";
import {connectWhatsApp} from "./whatsapp/connection";
import {chatbotController, messageController} from "./controller/messageController";


const port = process.env.PORT || 3007

const router = express()
router.use(express.json())

// run in main file
fetchLatestBaileysVersion()
    .then(({version, isLatest}) => {
        connectWhatsApp(version)
    })

router.use('/whatsapp/messages/text', messageController)
router.use('/whatsapp/messages/chatbot', chatbotController)
// router.use('/whats/messages/buttons', buttonMessageController)
// router.use('/whats/messages/medias', mediaMessageController)
// router.use('/whats/profile/picture', profilePicture)
// router.use('/whats/contacts/block', blockContact)
// router.use('/whats/contacts/is-on-whats', isOnWhatsapp)

router.listen(port, () => {
    console.log(`Server iniciou na porta ${port}! 🚀`);
});