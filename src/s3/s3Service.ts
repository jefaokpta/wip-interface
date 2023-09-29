import path from "path";
import fs from "fs";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
import {CONTROL_NUMBER} from "../util/systemConstants";

const BUCKET_NAME = 'wip-medias'
const s3 = new S3Client({
    region: 'us-east-1',
})

export function putObjectInS3(buffer: Buffer, mediaUrl: string) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: `uploads/medias/${CONTROL_NUMBER}/${mediaUrl}`,
        Body: buffer
    }
    console.log(`🚚 FAZENDO UPLOAD DO ARQUIVO ${mediaUrl} NO S3...`)
    s3.send(new PutObjectCommand(params))
        .catch(err => console.log('ERRO 🧨 AO FAZER UPLOAD DO ARQUIVO', err.message))
}

export function moveObjectThroughS3(oldPath: string, newPath: string) {
    const params = {
        Bucket: BUCKET_NAME,
        CopySource: `/${BUCKET_NAME}/uploads/${oldPath}`,
        Key: `uploads/medias/${CONTROL_NUMBER}/${newPath}`
    }
    console.log(`🚚 MOVENDO ARQUIVO ${oldPath} PARA ${newPath} NO S3...`)
    s3.send(new CopyObjectCommand(params))
        .then(() => {
            const params = {
                Bucket: BUCKET_NAME,
                Key: `uploads/${oldPath}`
            }
            s3.send(new DeleteObjectCommand(params))
                .catch(err => console.log(`ERRO 🧨 AO DELETAR ARQUIVO ${oldPath}`, err.message))
        })
        .catch(err => console.log(`ERRO 🧨 AO MOVER ARQUIVO ${oldPath}`, err.message))
}

export function uploadFolderToS3(folderPath: string) {
    console.log('🚚 ATUALIZANDO AUTHS NO S3...')
    const folderContent = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const item of folderContent) {
        if(item.name.includes('session-')) continue //ignorando arquivos de sessao pra nao quebrar decriptacao
        const itemPath = path.join(folderPath, item.name);
        const params = {
            Bucket: BUCKET_NAME,
            Key: `auths/${itemPath}`,
            Body: fs.readFileSync(itemPath)
        }
        s3.send(new PutObjectCommand(params))
           .catch(err => {
            console.log('ERRO 🧨 AO FAZER UPLOAD DA PASTA AUTH', err.message)
        })
    }
}

export async function restoreFolderFromS3(folderName: string) {
    const params = {
        Bucket: BUCKET_NAME,
        Prefix: `auths/${folderName}`
    }

    await s3.send(new ListObjectsCommand(params))
        .then(data => {
            if (!data.Contents){
                console.log('Sem arquivos.')
                return
            }
            fs.existsSync(folderName) || fs.mkdirSync(folderName)
            for (const item of data.Contents) {
                console.log(item.Key)
                const params = {
                    Bucket: BUCKET_NAME,
                    Key: item.Key
                }

                s3.send(new GetObjectCommand(params))
                    .then(async data => {
                        fs.writeFileSync(`./${folderName}/${item.Key?.split('/').pop()}`, await data.Body!.transformToString('utf-8'))
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
        })
        .catch(err => {
            console.log(err)
        })
}