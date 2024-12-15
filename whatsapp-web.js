const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

// Configurar WhatsApp Web Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Caminho para o Chrome instalado
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

// Inicializar o cliente WhatsApp
client.initialize();

client.on('qr', (qr) => {
    console.log('Escaneie o QR Code para se conectar ao WhatsApp.');
    console.log(qr);
});

client.on('ready', () => {
    console.log('WhatsApp está conectado e pronto para uso!');
});

// Configurar Servidor Express
const app = express();
app.use(bodyParser.json());

// Rota para o Webhook
app.post('/webhook', async (req, res) => {
    try {
        const { from, type, message, mediaPath, caption } = req.body;

        console.log(`Mensagem recebida de ${from}: Tipo: ${type}, Conteúdo: ${message || mediaPath}`);

        // Enviar mensagens com base no tipo
        switch (type) {
            case 'text': // Texto
                await client.sendMessage(`${from}@c.us`, message);
                break;

            case 'image': // Imagem
                if (!fs.existsSync(mediaPath)) {
                    return res.status(400).send({ error: 'Caminho da imagem não encontrado.' });
                }
                const image = MessageMedia.fromFilePath(mediaPath);
                await client.sendMessage(`${from}@c.us`, image, { caption });
                break;

            case 'audio': // Áudio
                if (!fs.existsSync(mediaPath)) {
                    return res.status(400).send({ error: 'Caminho do áudio não encontrado.' });
                }
                const audio = MessageMedia.fromFilePath(mediaPath);
                await client.sendMessage(`${from}@c.us`, audio);
                break;

            case 'video': // Vídeo
                if (!fs.existsSync(mediaPath)) {
                    return res.status(400).send({ error: 'Caminho do vídeo não encontrado.' });
                }
                const video = MessageMedia.fromFilePath(mediaPath);
                await client.sendMessage(`${from}@c.us`, video, { caption });
                break;

            case 'file': // Arquivo
                if (!fs.existsSync(mediaPath)) {
                    return res.status(400).send({ error: 'Caminho do arquivo não encontrado.' });
                }
                const file = MessageMedia.fromFilePath(mediaPath);
                await client.sendMessage(`${from}@c.us`, file, { caption });
                break;

            default:
                return res.status(400).send({ error: 'Tipo de mensagem inválido.' });
        }

        res.status(200).send({ status: `Mensagem do tipo ${type} enviada para ${from}` });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send({ error: 'Erro ao enviar mensagem.' });
    }
});

// Iniciar o servidor
const PORT = 3000; // Porta do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
