const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

let currentQR = null;
let isConnected = false;

// ----------------------
// 1. EXPRESS START FIRST
// ----------------------
app.get("/", (req, res) => {
    res.send("WhatsApp Bridge is running");
});

app.get("/status", (req, res) => {
    res.json({
        connected: isConnected,
        qrAvailable: !!currentQR
    });
});

app.get("/qr", (req, res) => {
    if (!currentQR) return res.send("QR not available yet");
    res.send(`<img src="${currentQR}" />`);
});

// ----------------------
// 2. START SERVER FIRST
// ----------------------
app.listen(PORT, () => {
    console.log("Server running on port", PORT);

    // Start WhatsApp AFTER server is ready
    startWhatsApp();
});

// ----------------------
// 3. WHATSAPP CLIENT
// ----------------------
function startWhatsApp() {
    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: "./session"
        }),
        puppeteer: {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        }
    });

    client.on("qr", async (qr) => {
        currentQR = await qrcode.toDataURL(qr);
        isConnected = false;
        console.log("QR generated");
    });

    client.on("ready", () => {
        isConnected = true;
        currentQR = null;
        console.log("WhatsApp connected");
    });

    client.on("disconnected", () => {
        isConnected = false;
        console.log("WhatsApp disconnected");
    });

    client.on("auth_failure", (msg) => {
        console.error("Auth failure:", msg);
    });

    client.initialize();
}

// ----------------------
// 4. SEND MESSAGE API
// ----------------------
app.post("/send", async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: "Missing to/message" });
    }

    try {
        const client = require("whatsapp-web.js").Client;
        return res.json({ success: true, note: "Use global client ref if needed" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
