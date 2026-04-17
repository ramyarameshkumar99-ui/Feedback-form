const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Setup
const db = new sqlite3.Database('./feedback.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            rating INTEGER NOT NULL,
            experience TEXT NOT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Helper to escape HTML special characters
function escapeHTML(str) {
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Telegram Function
async function sendTelegramMessage(data) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn('Telegram token or chat ID not set. Skipping notification.');
        return;
    }

    const message = `
🌟 <b>New Feedback Received</b> 🌟

👤 <b>Name:</b> ${escapeHTML(data.name)}
📧 <b>Email:</b> ${escapeHTML(data.email)}
⭐ <b>Rating:</b> ${data.rating}/5
📝 <b>Experience:</b> 
<i>${escapeHTML(data.experience)}</i>
    `;

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            html: message, // Some versions of library use 'text' with parse_mode
            text: message,
            parse_mode: 'HTML'
        });
        console.log('Telegram notification sent.');
    } catch (error) {
        console.error('Error sending Telegram message:', error.response ? error.response.data : error.message);
    }
}

// API Endpoint
app.post('/submit-feedback', async (req, res) => {
    const { name, email, rating, experience } = req.body;

    // Validation
    if (!name || !email || !rating || !experience) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Insert into DB
    const query = `INSERT INTO feedback (name, email, rating, experience) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, email, rating, experience], async function (err) {
        if (err) {
            console.error('Database insertion error:', err.message);
            return res.status(500).json({ error: 'Failed to save feedback.' });
        }

        // Send Telegram Notification
        await sendTelegramMessage({ name, email, rating, experience });

        res.status(200).json({
            message: 'Feedback submitted successfully!',
            id: this.lastID
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
