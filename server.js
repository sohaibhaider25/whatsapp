{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const express = require('express');\
const \{ Client, LocalAuth \} = require('whatsapp-web.js');\
const qrcode = require('qrcode');\
\
const app = express();\
app.use(express.json());\
\
// Railway / cloud port\
const PORT = process.env.PORT || 3000;\
\
// State\
let currentQR = null;\
let isConnected = false;\
\
// WhatsApp client\
const client = new Client(\{\
    authStrategy: new LocalAuth(\{\
        dataPath: './session' // note: not persistent on Railway free\
    \}),\
    puppeteer: \{\
        headless: true,\
        args: ['--no-sandbox', '--disable-setuid-sandbox']\
    \}\
\});\
\
// Generate QR\
client.on('qr', async (qr) => \{\
    currentQR = await qrcode.toDataURL(qr);\
    isConnected = false;\
    console.log('QR generated');\
\});\
\
// Ready\
client.on('ready', () => \{\
    isConnected = true;\
    currentQR = null;\
    console.log('WhatsApp connected!');\
\});\
\
// Disconnected\
client.on('disconnected', () => \{\
    isConnected = false;\
    console.log('WhatsApp disconnected');\
\});\
\
// Init client\
client.initialize();\
\
// Root route (quick check)\
app.get('/', (req, res) => \{\
    res.send('WhatsApp Bridge is running');\
\});\
\
// Status endpoint\
app.get('/status', (req, res) => \{\
    if (isConnected) \{\
        return res.json(\{ status: 'connected' \});\
    \}\
    if (currentQR) \{\
        return res.json(\{ status: 'qr', qr: currentQR \});\
    \}\
    return res.json(\{ status: 'disconnected' \});\
\});\
\
// Optional: direct QR view in browser\
app.get('/qr', (req, res) => \{\
    if (!currentQR) \{\
        return res.send('No QR available. Try /status');\
    \}\
    res.send(`<img src="$\{currentQR\}" />`);\
\});\
\
// Send message\
app.post('/send', async (req, res) => \{\
    const \{ to, message \} = req.body;\
\
    if (!to || !message) \{\
        return res.status(400).json(\{ error: 'Missing "to" or "message"' \});\
    \}\
\
    if (!isConnected) \{\
        return res.status(503).json(\{ error: 'WhatsApp not connected' \});\
    \}\
\
    try \{\
        await client.sendMessage(to, message);\
        res.json(\{ success: true \});\
    \} catch (err) \{\
        console.error(err);\
        res.status(500).json(\{ error: err.message \});\
    \}\
\});\
\
// Logout\
app.post('/logout', async (req, res) => \{\
    try \{\
        await client.logout();\
    \} catch (e) \{\}\
    isConnected = false;\
    res.json(\{ success: true \});\
\});\
\
// Start server\
app.listen(PORT, () => \{\
    console.log(`Bridge running on port $\{PORT\}`);\
\});}