import express from 'express'
import {fetchLatestBaileysVersion} from "@whiskeysockets/baileys";
import {connectWhatsApp} from "./whatsapp/connection";
import {
    blockContact,
    surveyMessageController,
    chatbotController,
    isOnWhatsapp,
    messageController, mediaMessageTransmission
} from "./controller/messageController";
import {profilePicture} from "./controller/profilePictureController";
import {CONTROL_NUMBER} from "./util/systemConstants";

const port = process.env.PORT ?? 3007

const router = express()
router.use(express.json())

fetchLatestBaileysVersion()
    .then(({version, isLatest}) => {
        connectWhatsApp(version)
            .then(() => {
                console.log('⏱️ 11 segundos para iniciar o servidor e garantir que o whatsapp esteja logado')
                setTimeout(() => {
                    router.listen(port, () => {
                        console.log(`Server iniciou na porta ${port}! 🚀 EMPRESA ${CONTROL_NUMBER}`);
                    });
                }, 11000)
            })
    })

router.use('/whatsapp/messages/text', messageController)
router.use('/whatsapp/messages/chatbot', chatbotController)
router.use('/whatsapp/messages/survey', surveyMessageController)
router.use('/whatsapp/messages/media-message-transmission', mediaMessageTransmission)
router.use('/whatsapp/profile/picture', profilePicture)
router.use('/whatsapp/contacts/block', blockContact)
router.use('/whatsapp/contacts/is-on-whats', isOnWhatsapp)

