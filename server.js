const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

let currentQR = null;
let isConnected = false;

// WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR event
client.on('qr', async (qr) => {
    currentQR = await qrcode.toDataURL(qr);
    isConnected = false;
    console.log('QR generated');
});

// Ready event
client.on('ready', () => {
    isConnected = true;
    currentQR = null;
    console.log('WhatsApp connected');
});

// Disconnect event
client.on('disconnected', () => {
    isConnected = false;
    console.log('WhatsApp disconnected');
});

// Initialize client
client.initialize();

// Root check
app.get('/', (req, res) => {
    res.send('Bridge is running');
});

// Status API
app.get('/status', (req, res) => {
    if (isConnected) return res.json({ status: 'connected' });
    if (currentQR) return res.json({ status: 'qr', qr: currentQR });
    res.json({ status: 'disconnected' });
});

// QR view in browser
app.get('/qr', (req, res) => {
    if (!currentQR) return res.send('No QR available');
    res.send(`<img src="${currentQR}" />`);
});

// Send message
app.post('/send', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    if (!isConnected) {
        return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    try {
        await client.sendMessage(to, message);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Logout
app.post('/logout', async (req, res) => {
    try {
        await client.logout();
    } catch (e) {}
    isConnected = false;
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});