require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const responsesFile = path.join(__dirname, 'responses.json');

if (!fs.existsSync(responsesFile)) {
    fs.writeFileSync(responsesFile, JSON.stringify([]));
}


app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    let responses = JSON.parse(fs.readFileSync(responsesFile, 'utf8'));
    const newEntry = { name, email, subject, message, date: new Date().toISOString() };
    responses.push(newEntry);
    fs.writeFileSync(responsesFile, JSON.stringify(responses, null, 2));

    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVER,
            subject: `New Contact Form Submission: ${subject}`,
            text: `You have a new message from ${name} (${email}):\n\n${message}`,
        });

        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));