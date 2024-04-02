
const express = require('express');
const cors = require('cors');
const deepl = require('deepl-node');
const dotenv = require("dotenv");
dotenv.config()

const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

const donation = {
    user: 0,
    amount: 0
};

const app = express();

app.use(express.json());
app.use(cors());

app.post('/translate', async (req, res) => {
    const response = await translator.translateText(req.body.text, null, req.body.locale)

    return res.json(response)
})

app.post('/donate', (req, res) => {
    const amount = req.body.amount || 0;

    if (amount > 0) {
        donation.amount += amount;
        donation.user += 1;
    }

    return res.json({ message: 'Thank you ?'});
});

app.post('/chat', (req, res) => {
    // TODO: Send message to chat after 5seconds
    setTimeout(() => {
        return res.json({message: req.body.message});
    }, 5000);
})

const SEND_INTERVAL = 1000;

const writeEvent = (res, sseId, data) => {
    res.write(`id: ${sseId}\n`);
    res.write(`data: ${data}\n\n`);
};

const sendEvent = (_req, res) => {
    res.writeHead(200, {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
    });

    const sseId = new Date().toDateString();

    setInterval(() => {
        writeEvent(res, sseId, JSON.stringify(donation));
    }, SEND_INTERVAL);

    writeEvent(res, sseId, JSON.stringify(donation));
};

app.get('/dashboard', (req, res) => {
    if (req.headers.accept === 'text/event-stream') {
        sendEvent(req, res);
    } else {
        res.json({ message: 'Ok' });
    }
});

app.listen(4650, () => {
    console.log(`Application started on URL ?`);
});