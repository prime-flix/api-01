const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // Usaremos o axios para enviar dados ao webhook

const app = express();
app.use(bodyParser.json());

// Configuração do cliente com persistência da sessão
const client = new Client({
    authStrategy: new LocalAuth(), // Salva automaticamente os dados da sessão localmente
});

client.on('qr', (qr) => {
    console.log('Scan o QR Code abaixo:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp está pronto!');
});

// Configuração da URL do webhook para onde as mensagens serão enviadas
const webhookUrls = [
    'https://primeflix.app.n8n.cloud/webhook-test/ai/tbest/luiza/a545649b-4c7d-449c-b75a-038c9b456347',
    'https://primeflix.app.n8n.cloud/webhook/ai/tbest/luiza/a545649b-4c7d-449c-b75a-038c9b456347'
];

// Processamento de mensagens recebidas
client.on('message', async (message) => {
    console.log(`Mensagem recebida de ${message.from}: ${message.body}`);

    // Dados da mensagem a serem enviados para o webhook
    const messageData = {
        from: message.from.replace('@c.us', ''), // Remove o sufixo
        body: message.body, // Texto da mensagem
        timestamp: message.timestamp, // Timestamp da mensagem
        type: message.type, // Tipo da mensagem (texto, imagem, áudio, etc.)
        id: message.id.id, // ID da mensagem
    };

    // Enviar os dados para todas as URLs no array webhookUrls
    try {
        for (let webhookUrl of webhookUrls) {
            await axios.post(webhookUrl, messageData);
            console.log(`Mensagem enviada ao webhook ${webhookUrl} com sucesso!`);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem ao webhook:', error.message);
    }
});

// Rota para enviar mensagem de texto
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    try {
        const formattedPhone = `${phone}@c.us`; // Adiciona o sufixo internamente
        await client.sendMessage(formattedPhone, message);
        res.status(200).send({ status: 'Mensagem de texto enviada!' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Rota para enviar mídia (imagem, áudio, vídeo, arquivo)
app.post('/send-media', async (req, res) => {
    const { phone, type, mediaPath, caption } = req.body;

    try {
        const formattedPhone = `${phone}@c.us`; // Adiciona o sufixo internamente

        let media;
        switch (type) {
            case 'image':
                media = await client.prepareMessageMedia(fs.readFileSync(mediaPath), 'image/jpeg');
                await client.sendMessage(formattedPhone, media, { caption });
                break;
            case 'audio':
                media = await client.prepareMessageMedia(fs.readFileSync(mediaPath), 'audio/mp3');
                await client.sendMessage(formattedPhone, media);
                break;
            case 'video':
                media = await client.prepareMessageMedia(fs.readFileSync(mediaPath), 'video/mp4');
                await client.sendMessage(formattedPhone, media, { caption });
                break;
            case 'file':
                media = await client.prepareMessageMedia(fs.readFileSync(mediaPath), 'application/pdf');
                await client.sendMessage(formattedPhone, media, { caption });
                break;
            default:
                return res.status(400).send({ error: 'Tipo de mídia não suportado.' });
        }

        res.status(200).send({ status: `Mídia de tipo ${type} enviada!` });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Inicializa o cliente do WhatsApp
client.initialize();

// Inicia o servidor Express
const port = 3000; // Você pode escolher outra porta, se necessário
app.listen(port, () => {
    console.log(`Servidor Express rodando na porta ${port}`);
});
