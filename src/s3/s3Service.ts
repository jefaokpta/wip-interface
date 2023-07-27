import path from "path";
import fs from "fs";
import {GetObjectCommand, ListObjectsCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: 'us-east-1',
})

export async function downloadFileFromS3(fileName: string) {
    const params = {
        Bucket: 'wip-medias',
        Key: `uploads/${fileName}`
    }

    const commandOutputPromise = await s3.send(new GetObjectCommand(params));

    return commandOutputPromise.Body?.transformToByteArray()
    // .then(async data => {
    //
    //     fs.writeFileSync(fileName, await data.Body!!.transformToString('utf-8'))
    // })
    // .catch(err => {
    //     console.log(err)
    // })
}

export function uploadFolderToS3(folderPath: string) {
    console.log('🚚 ATUALIZANDO AUTHS NO S3...')
    const folderContent = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const item of folderContent) {
        const itemPath = path.join(folderPath, item.name);
        const params = {
            Bucket: 'wip-medias',
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
        Bucket: 'wip-medias',
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
                    Bucket: 'wip-medias',
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