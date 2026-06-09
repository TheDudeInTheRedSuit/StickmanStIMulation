const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 3000;
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

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
    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Name required' });
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

// ── AI SCENARIO GENERATION ────────────────────────────────────────────────────

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL_PREFERENCE = ['gemma4:2b-mlx', 'gemma4:4b-mlx'];
const POOL_SIZE = 6;

const STAT_NAMES = ['speed', 'strength', 'agility', 'stamina', 'health', 'healing'];
const PROBLEM_IDS = [
    'social_anxiety', 'old_injury', 'poor_diet', 'lack_of_exercise', 'insomnia', 'burnout',
    'toxic_relationships', 'chronic_pain', 'vitamin_deficiency', 'financial_stress',
    'existential_dread', 'bad_at_goodbyes', 'phantom_vibration', 'wrong_name', 'hiccups',
    'replied_all', 'stubbed_toe', 'overslept', 'jar_weakness', 'lost_keys',
    'sun_sneeze', 'embarrassing_memory', 'lego_foot', 'bird_enemy', 'waiter_incident',
];

const SYSTEM_PROMPT = `You generate humorous life-choice scenarios for a time-travel RPG. The tone is dry British humour — deadpan, specific, and absurd, like a British comedy novel.

Output a single JSON object with this exact structure and nothing else:
{
  "age": <integer 5-40>,
  "title": "<short witty title, max 6 words>",
  "description": "<2-3 sentences in second person using 'you', specific and funny>",
  "choices": [
    {
      "text": "<choice text in first person, max 12 words>",
      "flavor": "<1-2 sentences of what happens, dry humour>",
      "healthy": <true or false>
    },
    {
      "text": "<choice text in first person, max 12 words>",
      "flavor": "<1-2 sentences of what happens, dry humour>",
      "healthy": <true or false>
    }
  ]
}`;

let activeModel = null;
let scenarioPool = [];
let poolBusy = false;
let genCount = 0;

const rand = n => Math.floor(Math.random() * n);
const pick = arr => arr[rand(arr.length)];

function makeStats(healthy) {
    const result = {};
    if (healthy) {
        const a = pick(STAT_NAMES);
        result[a] = [4 + rand(5), 3];
        if (Math.random() > 0.4) {
            const b = pick(STAT_NAMES.filter(s => s !== a));
            result[b] = [2 + rand(4), 2];
        }
        if (Math.random() > 0.65) {
            const c = pick(STAT_NAMES.filter(s => !result[s]));
            if (c) result[c] = [-(1 + rand(3)), 2];
        }
    } else {
        const a = pick(STAT_NAMES);
        result[a] = [-(4 + rand(6)), 3];
        if (Math.random() > 0.4) {
            const b = pick(STAT_NAMES.filter(s => s !== a));
            result[b] = [-(2 + rand(4)), 2];
        }
        if (Math.random() > 0.55) {
            const c = pick(STAT_NAMES.filter(s => !result[s]));
            if (c) result[c] = [2 + rand(3), 2];
        }
    }
    return result;
}

function makeProblems(healthy) {
    if (healthy) {
        return Math.random() > 0.55
            ? [[pick(PROBLEM_IDS), +(0.2 + Math.random() * 0.25).toFixed(2)]]
            : [];
    }
    const list = [[pick(PROBLEM_IDS), +(0.5 + Math.random() * 0.4).toFixed(2)]];
    if (Math.random() > 0.5) list.push([pick(PROBLEM_IDS), +(0.25 + Math.random() * 0.3).toFixed(2)]);
    return list;
}

function normalizeScenario(raw) {
    return {
        id: `ai_${++genCount}_${Date.now()}`,
        age: Math.max(5, Math.min(40, Math.round(Number(raw.age) || 20))),
        title: String(raw.title || 'A Moment'),
        description: String(raw.description || ''),
        aiGenerated: true,
        choices: (Array.isArray(raw.choices) ? raw.choices.slice(0, 2) : []).map(c => ({
            text: String(c.text || ''),
            flavor: String(c.flavor || ''),
            stats: makeStats(c.healthy !== false),
            solve: [],
            create: makeProblems(c.healthy !== false),
        })),
    };
}

function ollamaPost(reqPath, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(
            {
                hostname: OLLAMA_HOST, port: OLLAMA_PORT, path: reqPath, method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
            },
            res => {
                let buf = '';
                res.on('data', d => { buf += d; });
                res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { reject(new Error('Bad JSON from Ollama')); } });
            }
        );
        req.setTimeout(90000, () => { req.destroy(new Error('Ollama timeout')); });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function ollamaGet(reqPath) {
    return new Promise((resolve, reject) => {
        const req = http.request(
            { hostname: OLLAMA_HOST, port: OLLAMA_PORT, path: reqPath, method: 'GET' },
            res => {
                let buf = '';
                res.on('data', d => { buf += d; });
                res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { reject(new Error('Bad JSON')); } });
            }
        );
        req.setTimeout(5000, () => { req.destroy(new Error('Timeout')); });
        req.on('error', reject);
        req.end();
    });
}

async function detectModel() {
    try {
        const { models } = await ollamaGet('/api/tags');
        for (const pref of MODEL_PREFERENCE) {
            if (models.some(m => m.name === pref)) return pref;
        }
    } catch { /* Ollama not running */ }
    return null;
}

async function generateScenario() {
    if (!activeModel) return null;
    try {
        const data = await ollamaPost('/api/generate', {
            model: activeModel,
            system: SYSTEM_PROMPT,
            prompt: 'Generate a life scenario.',
            format: 'json',
            stream: false,
            options: { temperature: 0.95, top_p: 0.9 },
        });
        const raw = JSON.parse(data.response);
        if (!raw.age || !raw.title || !Array.isArray(raw.choices) || raw.choices.length < 2) return null;
        return normalizeScenario(raw);
    } catch (e) {
        console.error('  Scenario error:', e.message);
        return null;
    }
}

async function replenishPool() {
    if (poolBusy || scenarioPool.length >= POOL_SIZE) return;
    poolBusy = true;
    const needed = POOL_SIZE - scenarioPool.length;
    const results = await Promise.all(Array.from({ length: needed }, () => generateScenario()));
    results.forEach(s => { if (s) scenarioPool.push(s); });
    console.log(`  Scenario pool: ${scenarioPool.length}/${POOL_SIZE}`);
    poolBusy = false;
}

app.get('/api/scenario', (req, res) => {
    if (scenarioPool.length === 0) return res.status(503).json({ error: 'no_scenarios' });
    const s = scenarioPool.shift();
    if (scenarioPool.length < POOL_SIZE) replenishPool();
    res.json(s);
});

app.get('/api/scenario/status', (req, res) => {
    res.json({ available: scenarioPool.length, model: activeModel });
});

// ── START ──────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
    console.log(`\n  Time Traveller running at http://localhost:${PORT}\n`);
    activeModel = await detectModel();
    if (activeModel) {
        console.log(`  Model: ${activeModel}`);
        replenishPool();
    } else {
        console.log('  Ollama not available — using static scenarios as fallback\n');
    }
});
