const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readAccounts() {
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
}

function writeAccounts(data) {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/accounts', (req, res) => {
    const data = readAccounts();
    res.json(data.accounts.map(a => ({ name: a.name, xp: a.xp, timeTravels: a.timeTravels || 0 })));
});

app.post('/api/login', (req, res) => {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name required' });
    }
    const trimmed = name.trim();
    const data = readAccounts();
    let account = data.accounts.find(a => a.name.toLowerCase() === trimmed.toLowerCase());
    const isNew = !account;

    if (isNew) {
        account = { name: trimmed, xp: 0, timeTravels: 0, createdAt: new Date().toISOString() };
        data.accounts.push(account);
        writeAccounts(data);
    }

    res.json({ account, isNew });
});

app.post('/api/save', (req, res) => {
    const { name, xp, timeTravels } = req.body;
    const data = readAccounts();
    const account = data.accounts.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (!account) return res.status(404).json({ error: 'Account not found' });

    account.xp = xp;
    account.timeTravels = timeTravels;
    writeAccounts(data);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`\n  Time Traveller is running.\n  Open http://localhost:${PORT}\n`);
});
