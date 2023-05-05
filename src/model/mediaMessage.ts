

export interface MediaMessage {
    remoteJid: string;
    instanceId: number;
    fileType: string;
    ptt: boolean;
    caption: string;
    filePath: string;
}