// ── GAME DATA ─────────────────────────────────────────────────────────────────

const STAT_NAMES = ['speed', 'strength', 'agility', 'stamina', 'health', 'healing'];

const PROBLEMS = {
  social_anxiety:      { name: 'Social Anxiety',           icon: '😰', desc: "Replaying conversations from 2015 instead of sleeping." },
  old_injury:          { name: 'The Old Injury',           icon: '🩹', desc: "That thing you did that one time. It's back. It never left." },
  poor_diet:           { name: 'Garbage Diet',             icon: '🍕', desc: "You consider pizza a vegetable. You have for years." },
  lack_of_exercise:    { name: 'Sedentary Chaos',          icon: '🛋️', desc: "Your couch has a you-shaped dent in it." },
  insomnia:            { name: 'Insomnia',                 icon: '😴', desc: "2am. Fully awake. Thinking about the waiter incident." },
  burnout:             { name: 'Burnout',                  icon: '🔥', desc: "The fire went out. So did you." },
  toxic_relationships: { name: 'Relationship Chaos',       icon: '💔', desc: "It's complicated. It's always complicated." },
  chronic_pain:        { name: 'Mysterious Back Pain',     icon: '⚡', desc: "You slept funny. Three years ago." },
  vitamin_deficiency:  { name: 'Vitamin Chaos',            icon: '💊', desc: "You take supplements with every meal and are somehow still deficient." },
  financial_stress:    { name: 'Financial Stress',         icon: '💸', desc: "You have no idea where the money goes. The money knows." },
  lego_foot:           { name: 'The LEGO Curse',           icon: '🧱', desc: "You step on a LEGO at least once a week. You have accepted it." },
  bird_enemy:          { name: 'Personal Bird Enemy',      icon: '🐦', desc: "A specific crow has made you its project. You do not know why." },
  waiter_incident:     { name: '"You Too" Reflex',         icon: '🍽️', desc: 'When the waiter says "enjoy your meal" you say "you too." Every. Single. Time.' },
  phantom_vibration:   { name: 'Phantom Vibrations',       icon: '📳', desc: "Your phone never actually buzzed. It never does anymore." },
  wrong_name:          { name: 'Wrong Name Too Long',      icon: '😅', desc: "You've called Dave \"Steve\" for three years. It's way too late to fix it." },
  hiccups:             { name: 'Mysterious Hiccups',       icon: '💨', desc: "They arrive at the worst moments. Interviews. Funerals. Silences." },
  replied_all:         { name: 'The Reply-All Incident',   icon: '📧', desc: "You replied-all. You know what you said. So does accounting." },
  existential_dread:   { name: 'Existential Dread',        icon: '🌀', desc: "Mid-meeting, you realised everyone is just winging it. Including you. Especially you." },
  bad_at_goodbyes:     { name: 'Bad at Goodbyes',          icon: '👋', desc: "You've done the walk-and-talk more times than you can count. The second goodbye always catches you." },
  stubbed_toe:         { name: 'The Stubbed Toe',          icon: '🦶', desc: "Same toe. Same coffee table. You've started apologising to the furniture." },
  overslept:           { name: 'Chronic Oversleeper',      icon: '⏰', desc: "Your alarm is not your friend. It is your nemesis and it is winning." },
  jar_weakness:        { name: 'Cannot Open Jars',         icon: '🫙', desc: "Every jar defeats you. Every. Single. One." },
  lost_keys:           { name: 'Always Loses Keys',        icon: '🔑', desc: "They were literally just here. They are not here anymore." },
  sun_sneeze:          { name: 'Sun Sneezes',              icon: '☀️', desc: "You sneeze violently every time you look at the sun. It is not a superpower." },
  embarrassing_memory: { name: 'The 2007 Cringe',          icon: '😬', desc: "That one thing you said at that party. You will carry it forever." },
};

// Problems that can randomly strike at any time for no reason
const RANDOM_CHAOS = [
  { id: 'lego_foot',           message: "Meanwhile, you stepped on a LEGO. For no reason. Just life." },
  { id: 'bird_enemy',          message: "Also, a crow has decided you are its enemy now. Unprompted." },
  { id: 'waiter_incident',     message: 'The waiter said "enjoy your meal." You said "you too." It happened again.' },
  { id: 'phantom_vibration',   message: "Your phone vibrated. It did not vibrate." },
  { id: 'wrong_name',          message: "You called someone the wrong name. You will now call them that forever." },
  { id: 'hiccups',             message: "You have developed hiccups at an extremely inconvenient time." },
  { id: 'replied_all',         message: "You replied-all to an email. Everyone saw it. Especially accounting." },
  { id: 'existential_dread',   message: "You suddenly and deeply questioned the nature of your existence. During a meeting." },
  { id: 'bad_at_goodbyes',     message: "You said goodbye and then walked in the same direction as them for four blocks." },
  { id: 'stubbed_toe',         message: "You stubbed your toe on the same coffee table. Again. You apologised to the table." },
  { id: 'overslept',           message: "You set three alarms. You slept through all of them. You are not sorry." },
  { id: 'jar_weakness',        message: "A jar defeated you today. A simple jar. You stared at it for a while." },
  { id: 'lost_keys',           message: "Your keys vanished. They were in your hand moments ago. They are gone." },
  { id: 'sun_sneeze',          message: "You looked at the sun and sneezed so hard your hat fell off." },
  { id: 'embarrassing_memory', message: "That thing from 2007 resurfaced. Out of nowhere. Just floated up. You had a great day until now." },
  { id: 'poor_diet',           message: "You ate an entire bag of crisps for dinner and felt fine about it, which is its own problem." },
  { id: 'insomnia',            message: "You couldn't sleep. You thought about the waiter incident. Then the crow. Then the jar. Then 2007." },
  { id: 'social_anxiety',      message: "You waved back at someone who wasn't waving at you. They saw. You both pretended it didn't happen." },
];

const SCENARIOS = [
  {
    id: 'bully', age: 7, title: 'The Milk Incident',
    description: "A kid at school spilled your milk. On purpose. While making eye contact. He is smiling. The whole cafeteria is watching. What do you do?",
    choices: [
      { text: 'Dramatically declare war',
        flavor: "You stood up, pointed at him and said 'this means war.' Nobody clapped. You sat back down. Milk still all over you.",
        stats: { strength: [4,4], health: [-5,4] },
        solve: [], create: [['social_anxiety', 0.75], ['embarrassing_memory', 0.80]] },
      { text: 'Cry. Just absolutely cry.',
        flavor: "Full sobs. In front of everyone. Somehow this worked — teachers arrived, he got in trouble, and you got a free pudding cup. Mixed results.",
        stats: { healing: [3,3], stamina: [-4,3] },
        solve: [], create: [['social_anxiety', 0.85], ['bad_at_goodbyes', 0.50]] },
    ],
  },
  {
    id: 'sports', age: 12, title: 'The Team Tryout',
    description: "The school football team is holding tryouts. You could give it your all — or sit in the bleachers and eat snacks, which is also an option.",
    choices: [
      { text: 'Train hard and actually try out',
        flavor: "You pushed your body every afternoon. You made the cut. You celebrated and immediately pulled something.",
        stats: { speed: [5,5], strength: [4,4], agility: [4,4] },
        solve: ['lack_of_exercise'], create: [['old_injury', 0.70], ['overslept', 0.55]] },
      { text: 'Watch from the bleachers eating crisps',
        flavor: "You ate two bags of crisps and watched other people exercise. You felt great about this for about a week.",
        stats: { stamina: [-4,3], health: [-3,3] },
        solve: [], create: [['lack_of_exercise', 0.85], ['poor_diet', 0.65], ['existential_dread', 0.40]] },
    ],
  },
  {
    id: 'diet', age: 16, title: 'The Lunch Table',
    description: "High school cafeteria. Your friends eat junk food every single day. You could resist — or you could have another burger. This is a real decision you are making.",
    choices: [
      { text: 'Eat healthy, pack your own lunch',
        flavor: "You brought a salad. Everyone stared. Someone said 'are those leaves?' Yes. They are leaves. You ate them.",
        stats: { health: [6,5], healing: [5,4] },
        solve: ['poor_diet'], create: [['social_anxiety', 0.60], ['embarrassing_memory', 0.40]] },
      { text: 'Burgers every day, no regrets',
        flavor: "Delicious. Every single time. Your body is quietly, calmly, filing paperwork about this.",
        stats: { health: [-7,5], stamina: [-3,3] },
        solve: [], create: [['poor_diet', 0.90], ['vitamin_deficiency', 0.70], ['chronic_pain', 0.35]] },
    ],
  },
  {
    id: 'college', age: 19, title: 'The Campus Gym Situation',
    description: "The campus gym exists. You have a student membership. You have been to it once to get the water bottle. That was six months ago.",
    choices: [
      { text: 'Actually start going to the gym',
        flavor: "You went five days in a row. You were very sore. You told everyone. On day six you pulled your back lifting a water bottle.",
        stats: { speed: [6,5], strength: [6,5], agility: [4,4], stamina: [-3,3] },
        solve: ['lack_of_exercise'], create: [['old_injury', 0.75], ['burnout', 0.55], ['hiccups', 0.30]] },
      { text: 'Keep the membership as a "just in case"',
        flavor: "You kept paying for it. For two years. The water bottle now lives under your bed. You feel it judging you.",
        stats: { stamina: [-4,3], health: [-3,3] },
        solve: [], create: [['lack_of_exercise', 0.80], ['existential_dread', 0.65], ['financial_stress', 0.50]] },
    ],
  },
  {
    id: 'work', age: 24, title: 'The Grind',
    description: "Your first real job. Your boss literally said 'we're a family here.' You've been doing 70-hour weeks. The 'family' has not said thank you.",
    choices: [
      { text: 'Keep grinding — the promotion is close',
        flavor: "You got the promotion. The new role also requires 70-hour weeks. Congratulations.",
        stats: { strength: [3,3], stamina: [-9,5], healing: [-6,4], health: [-5,4] },
        solve: [], create: [['burnout', 0.90], ['insomnia', 0.80], ['phantom_vibration', 0.65]] },
      { text: 'Leave at 5pm. Every day. No exceptions.',
        flavor: "You left at 5pm. People stared. You slept 8 hours. On day three, you felt something you hadn't in months — fine. Just fine.",
        stats: { stamina: [6,4], healing: [5,4], health: [4,3] },
        solve: ['burnout'], create: [['existential_dread', 0.55], ['replied_all', 0.35]] },
    ],
  },
  {
    id: 'relationship', age: 27, title: 'The Situation',
    description: "You've been dating someone for three years. It is complicated. They called your crow 'just a bird.' Red flag? You're not sure. You're considering it.",
    choices: [
      { text: 'Stay. Work it out. The crow likes them fine.',
        flavor: "You stayed. The crow was not fine with it. Neither were you, really. But you made it work for another eighteen months.",
        stats: { healing: [-8,6], stamina: [-5,4], health: [-4,4] },
        solve: [], create: [['toxic_relationships', 0.85], ['insomnia', 0.70], ['bad_at_goodbyes', 0.50]] },
      { text: 'Break up. You and the crow deserve better.',
        flavor: "You broke up. It was hard. The crow was visibly relieved. You were fine six months later. Great, actually.",
        stats: { healing: [7,5], stamina: [5,4], agility: [4,3] },
        solve: ['toxic_relationships', 'insomnia'], create: [['existential_dread', 0.55], ['wrong_name', 0.40]] },
    ],
  },
  {
    id: 'health_scare', age: 31, title: 'The Weird Thing',
    description: "Something is off. Your knee makes a sound. Your back aches in a new spot. The doctor wants to run tests. You have Googled the symptoms and diagnosed yourself with seventeen things.",
    choices: [
      { text: "Ignore it. Google said it was fine. (It did not.)",
        flavor: "It was not fine. You waited six more months. It cost you considerably more to fix. You now have a standing appointment and regrets.",
        stats: { health: [-12,7], stamina: [-7,5], healing: [-5,4] },
        solve: [], create: [['chronic_pain', 0.85], ['vitamin_deficiency', 0.65], ['insomnia', 0.55]] },
      { text: 'See the actual doctor and do what they say',
        flavor: "The doctor fixed it in three appointments. You felt better than you had in two years. You told people. They were happy for you. It was fine.",
        stats: { health: [8,5], healing: [7,5], stamina: [4,3] },
        solve: ['chronic_pain', 'vitamin_deficiency', 'poor_diet'], create: [['waiter_incident', 0.50], ['jar_weakness', 0.40]] },
    ],
  },
  {
    id: 'gym', age: 35, title: 'The Monday That Never Came',
    description: "You have been saying 'I'll start Monday' for three years. There have been 156 Mondays. You have started zero of them. This Monday feels different though.",
    choices: [
      { text: 'This is the Monday. Hire a trainer.',
        flavor: "You hired a trainer. 6am starts. You cried on day two. You came back on day three. Four months later you could open a jar. A small one. Progress.",
        stats: { strength: [8,6], speed: [5,4], agility: [5,4], stamina: [4,3] },
        solve: ['lack_of_exercise', 'burnout'], create: [['old_injury', 0.60], ['overslept', 0.55], ['jar_weakness', 0.30]] },
      { text: "Next Monday. Definitely next Monday.",
        flavor: "Next Monday came and went. As did all the ones after. Your couch has a you-shaped dent now. It is permanent.",
        stats: { strength: [-7,5], speed: [-5,4], agility: [-5,4], stamina: [-5,4] },
        solve: [], create: [['lack_of_exercise', 0.95], ['chronic_pain', 0.70], ['existential_dread', 0.75]] },
    ],
  },
];

const STARTING_NARRATIVES = [
  "You're in your forties. Things are fine. Mostly fine. Fine-adjacent. You have a crow that follows you and a jar you can't open and honestly you're not sure how it got to this point.",
  "You wake up on a Tuesday and take stock. Your back hurts. The crow is on the windowsill again. You've been calling Dave 'Steve' for three years. Something must change.",
  "Life is going great, technically. You have a job, a home, and a growing collection of problems that arrived without warning and have made themselves very comfortable.",
  "It started small. A LEGO here. An embarrassing wave there. But the problems stacked up and now you're here, slightly tired, ready to go back and figure out where it all went wrong.",
];

// ── ACCOUNTS (localStorage) ───────────────────────────────────────────────────

const STORAGE_KEY = 'timeTraveller_accounts';

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { accounts: [] };
  } catch { return { accounts: [] }; }
}

function saveAccounts(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loginAccount(name, password) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const data = getAccounts();
  let account = data.accounts.find(a => a.name.toLowerCase() === trimmed.toLowerCase());
  const isNew = !account;

  if (isNew) {
    if (!password) return { error: 'Choose a password for your new account.' };
    const passwordHash = await hashPassword(password);
    account = { name: trimmed, xp: 0, timeTravels: 0, createdAt: new Date().toISOString(), passwordHash };
    data.accounts.push(account);
    saveAccounts(data);
  } else {
    if (account.passwordHash) {
      const hash = await hashPassword(password);
      if (hash !== account.passwordHash) return { error: 'Incorrect password.' };
    } else if (password) {
      // set password for existing passwordless accounts
      account.passwordHash = await hashPassword(password);
      saveAccounts(data);
    }
  }

  return { account, isNew };
}

function persistProgress() {
  if (!player) return;
  const data = getAccounts();
  const account = data.accounts.find(a => a.name.toLowerCase() === player.name.toLowerCase());
  if (account) {
    account.xp = totalXP;
    account.timeTravels = totalTimeTravels;
    saveAccounts(data);
  }
}

// ── STATE ─────────────────────────────────────────────────────────────────────

let player = null;
let stats = {};
let problems = [];
let totalXP = 0;
let totalTimeTravels = 0;
let visitedScenarioIds = [];
let selectedScenario = null;
let lastResultDeltas = null;
let scenarioCache = [];

// ── HELPERS ───────────────────────────────────────────────────────────────────

const rand = n => Math.floor(Math.random() * n);
const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
const pick = arr => arr[rand(arr.length)];

// ── SCREENS ───────────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  syncXP();
  syncName();
}

function syncXP() {
  document.querySelectorAll('[id^="xp-val"]').forEach(el => { el.textContent = totalXP; });
}

function syncName() {
  if (!player) return;
  document.querySelectorAll('.player-name-display').forEach(el => {
    el.textContent = player.name.toUpperCase();
  });
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────

function loadAccountsPanel() {
  const data = getAccounts();
  const container = document.getElementById('accounts-list');
  if (data.accounts.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = '<h3>RETURNING TRAVELLERS</h3>';
  data.accounts.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'account-chip';
    btn.innerHTML = `${a.name} <span class="chip-xp">✦ ${a.xp} XP</span>`;
    btn.addEventListener('click', () => {
      document.getElementById('name-input').value = a.name;
    });
    container.appendChild(btn);
  });
}

async function handleLogin() {
  const name = document.getElementById('name-input').value.trim();
  const password = document.getElementById('password-input').value;
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');

  if (!name) return;

  if (name.toLowerCase() === 'admin') {
    showAdminScreen();
    return;
  }

  const result = await loginAccount(name, password);
  if (!result) return;

  if (result.error) {
    errorEl.textContent = result.error;
    errorEl.classList.remove('hidden');
    return;
  }

  player = result.account;
  totalXP = player.xp;
  totalTimeTravels = player.timeTravels || 0;
  startGame();
}

document.getElementById('btn-login').addEventListener('click', handleLogin);
document.getElementById('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
document.getElementById('password-input').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

// ── GAME START ────────────────────────────────────────────────────────────────

function startGame() {
  stats = {};
  STAT_NAMES.forEach(s => { stats[s] = clamp(40 + rand(21)); });
  const allProblems = Object.keys(PROBLEMS);
  const shuffled = [...allProblems].sort(() => Math.random() - 0.5);
  problems = shuffled.slice(0, 2 + rand(3));
  visitedScenarioIds = [];
  prefetchScenarios();
  showIntro();
}

// ── INTRO SCREEN ──────────────────────────────────────────────────────────────

function showIntro() {
  document.getElementById('intro-narrative').textContent = pick(STARTING_NARRATIVES);
  renderProblemList('problem-list', problems);
  showScreen('intro');
}

document.getElementById('btn-to-stats').addEventListener('click', () => showStatsScreen(null));

// ── STATS SCREEN ──────────────────────────────────────────────────────────────

function showStatsScreen(deltas) {
  renderStatBars(deltas);
  renderProblemList('active-problems', problems);
  document.getElementById('btn-fight-boss').classList.toggle('hidden', totalTimeTravels < 3);
  showScreen('stats');
}

function renderStatBars(deltas) {
  const container = document.getElementById('stat-bars');
  container.innerHTML = '';
  STAT_NAMES.forEach(stat => {
    const val = stats[stat];
    const delta = deltas ? (deltas[stat] || 0) : 0;
    const row = document.createElement('div');
    row.className = 'stat-row';

    const barClass = val < 35 ? 'bar-low' : val < 65 ? 'bar-mid' : 'bar-high';

    row.innerHTML = `
      <span class="stat-label">${stat.toUpperCase()}</span>
      <div class="stat-bar-bg">
        <div class="stat-bar-fill ${barClass}" style="width:0%"></div>
      </div>
      <span class="stat-val${delta > 0 ? ' rising' : delta < 0 ? ' falling' : ''}">${val}</span>
    `;
    container.appendChild(row);

    const fill = row.querySelector('.stat-bar-fill');
    requestAnimationFrame(() => setTimeout(() => { fill.style.width = val + '%'; }, 40));
  });
}

function renderProblemList(containerId, list) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  if (list.length === 0) {
    el.innerHTML = '<span class="no-problems">✓ No active problems</span>';
    return;
  }
  list.forEach(pid => {
    const tag = document.createElement('span');
    tag.className = 'problem-tag';
    tag.textContent = `${PROBLEMS[pid].icon} ${PROBLEMS[pid].name}`;
    tag.title = PROBLEMS[pid].desc;
    el.appendChild(tag);
  });
}

document.getElementById('btn-time-travel').addEventListener('click', showTimeSelectScreen);
document.getElementById('btn-fight-boss').addEventListener('click', () => {
  showScreen('boss');
  initBossFight();
});

// ── AI SCENARIOS ──────────────────────────────────────────────────────────────

// Get a free key at aistudio.google.com — 1,500 requests/day on the free tier
const GEMINI_API_KEY = 'AQ.Ab8RN6LMAsB9HvTokKmI4BHhsVkPODuTO5EwwoIUnCF5nr3u1g';
const GEMINI_MODEL = 'gemini-1.5-flash';

let prefetching = false;
let genCount = 0;

const PROBLEM_IDS = Object.keys(PROBLEMS);

function makeStats(healthy) {
  const result = {};
  if (healthy) {
    const a = pick(STAT_NAMES);
    result[a] = [4 + rand(5), 3];
    if (Math.random() > 0.4) { const b = pick(STAT_NAMES.filter(s => s !== a)); result[b] = [2 + rand(4), 2]; }
    if (Math.random() > 0.65) { const c = pick(STAT_NAMES.filter(s => !result[s])); if (c) result[c] = [-(1 + rand(3)), 2]; }
  } else {
    const a = pick(STAT_NAMES);
    result[a] = [-(4 + rand(6)), 3];
    if (Math.random() > 0.4) { const b = pick(STAT_NAMES.filter(s => s !== a)); result[b] = [-(2 + rand(4)), 2]; }
    if (Math.random() > 0.55) { const c = pick(STAT_NAMES.filter(s => !result[s])); if (c) result[c] = [2 + rand(3), 2]; }
  }
  return result;
}

function makeProblems(healthy) {
  if (healthy) return Math.random() > 0.55 ? [[pick(PROBLEM_IDS), +(0.2 + Math.random() * 0.25).toFixed(2)]] : [];
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

const SCENARIO_SYSTEM_PROMPT = `You generate humorous life-choice scenarios for a time-travel RPG. The tone is dry British humour — deadpan, specific, and absurd, like a British comedy novel.

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

async function fetchGeminiScenario() {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SCENARIO_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: 'Generate a life scenario.' }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.95 },
      }),
    }
  );
  if (!resp.ok) return null;
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  const raw = JSON.parse(text);
  if (!raw.age || !raw.title || !Array.isArray(raw.choices) || raw.choices.length < 2) return null;
  return normalizeScenario(raw);
}

async function fetchScenario() {
  // Try local Ollama server first (when running via node server.js)
  try {
    const resp = await fetch('/api/scenario');
    if (resp.ok) {
      const s = await resp.json();
      if (!s.error) return s;
    }
  } catch { /* server not running */ }

  // Fall back to Gemini (GitHub Pages / no local server)
  if (!GEMINI_API_KEY) return null;
  try { return await fetchGeminiScenario(); } catch { return null; }
}

function prefetchScenarios() {
  if (prefetching) return;
  const needed = 6 - scenarioCache.length;
  if (needed <= 0) return;
  prefetching = true;
  Promise.all(Array.from({ length: needed }, () => fetchScenario()))
    .then(results => {
      results.forEach(s => { if (s) scenarioCache.push(s); });
      prefetching = false;
    });
}

// ── TIME SELECT SCREEN ────────────────────────────────────────────────────────

function renderScenarioCards(scenarios) {
  const container = document.getElementById('scenario-cards');
  container.innerHTML = '';
  scenarios.forEach(scenario => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    const visited = visitedScenarioIds.includes(scenario.id);
    card.innerHTML = `
      <div class="card-age">AGE ${scenario.age}</div>
      <div class="card-title">${scenario.title}</div>
      ${visited ? '<div class="card-visited">revisited</div>' : ''}
    `;
    card.addEventListener('click', () => showDecisionScreen(scenario));
    container.appendChild(card);
  });
}

function showTimeSelectScreen() {
  const ai = scenarioCache.splice(0, 4);
  let scenarios = ai;

  if (scenarios.length < 4) {
    const usedIds = new Set(scenarios.map(s => s.id));
    const fallbacks = [...SCENARIOS]
      .filter(s => !usedIds.has(s.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 4 - scenarios.length);
    scenarios = [...scenarios, ...fallbacks].sort(() => Math.random() - 0.5);
  }

  if (scenarioCache.length < 3) prefetchScenarios();

  renderScenarioCards(scenarios);
  showScreen('time-select');
}

document.getElementById('btn-back-to-stats').addEventListener('click', () => showStatsScreen(null));

// ── DECISION SCREEN ───────────────────────────────────────────────────────────

function showDecisionScreen(scenario) {
  selectedScenario = scenario;
  document.getElementById('decision-age').textContent = `AGE ${scenario.age}`;
  document.getElementById('decision-title').textContent = scenario.title;
  document.getElementById('decision-description').textContent = scenario.description;

  const el = document.getElementById('decision-choices');
  el.innerHTML = '';
  scenario.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = `<span class="choice-label">OPTION ${String.fromCharCode(65 + i)}</span>${choice.text}`;
    btn.addEventListener('click', () => resolveChoice(choice));
    el.appendChild(btn);
  });
  showScreen('decision');
}

// ── RESOLVE CHOICE ────────────────────────────────────────────────────────────

function resolveChoice(choice) {
  const deltas = {};
  STAT_NAMES.forEach(s => { deltas[s] = 0; });

  Object.entries(choice.stats || {}).forEach(([stat, [base, variance]]) => {
    const change = base + Math.floor((Math.random() * 2 - 1) * variance);
    deltas[stat] = change;
    stats[stat] = clamp(stats[stat] + change);
  });

  const solved = [];
  const created = [];

  choice.solve.forEach(pid => {
    if (problems.includes(pid)) {
      problems = problems.filter(p => p !== pid);
      solved.push(pid);
    }
  });

  choice.create.forEach(([pid, chance]) => {
    if (Math.random() < chance && !problems.includes(pid)) {
      problems.push(pid);
      created.push(pid);
    }
  });

  // Random chaos: ~55% chance something unrelated also goes wrong
  let chaosEvent = null;
  if (Math.random() < 0.55) {
    const eligible = RANDOM_CHAOS.filter(e => !problems.includes(e.id));
    if (eligible.length > 0) {
      chaosEvent = pick(eligible);
      problems.push(chaosEvent.id);
    }
  }

  const xpEarned = Math.max(5, 10 + solved.length * 15 - created.length * 5 - (chaosEvent ? 3 : 0) + rand(11));
  totalXP += xpEarned;
  totalTimeTravels++;

  if (!visitedScenarioIds.includes(selectedScenario.id)) {
    visitedScenarioIds.push(selectedScenario.id);
  }

  lastResultDeltas = deltas;
  persistProgress();
  showTransition(() => showResultScreen(choice, deltas, solved, created, xpEarned, chaosEvent));
}

// ── RESULT SCREEN ─────────────────────────────────────────────────────────────

function showResultScreen(choice, deltas, solved, created, xpEarned, chaosEvent) {
  document.getElementById('result-flavor').textContent = choice.flavor;

  const changesEl = document.getElementById('result-stat-changes');
  changesEl.innerHTML = '';
  let any = false;
  STAT_NAMES.forEach(stat => {
    const d = deltas[stat];
    if (!d) return;
    any = true;
    const dir = d > 0 ? 'pos' : 'neg';
    const row = document.createElement('div');
    row.className = 'change-row';
    row.innerHTML = `
      <span class="change-stat-name">${stat.toUpperCase()}</span>
      <span class="change-arrow" style="color:var(${d > 0 ? '--green' : '--red'})">${d > 0 ? '↑' : '↓'}</span>
      <div class="change-bar-bg">
        <div class="change-bar-fill ${dir}" style="width:0%" data-w="${Math.min(Math.abs(d), 30) * 3}%"></div>
      </div>
      <span class="change-delta ${dir}">${d > 0 ? '+' : ''}${d}</span>
    `;
    changesEl.appendChild(row);
  });
  if (!any) changesEl.innerHTML = '<span style="color:var(--text-dim);font-size:.82rem;font-family:monospace">No stat changes.</span>';

  requestAnimationFrame(() => {
    setTimeout(() => {
      changesEl.querySelectorAll('.change-bar-fill').forEach(el => {
        el.style.width = el.dataset.w;
      });
    }, 80);
  });

  const probEl = document.getElementById('result-problem-changes');
  probEl.innerHTML = '';
  solved.forEach(pid => {
    const row = document.createElement('div');
    row.className = 'problem-change solved';
    row.textContent = `✓ "${PROBLEMS[pid].name}" resolved`;
    probEl.appendChild(row);
  });
  created.forEach(pid => {
    const row = document.createElement('div');
    row.className = 'problem-change created';
    row.textContent = `✗ New problem: "${PROBLEMS[pid].name}"`;
    probEl.appendChild(row);
  });

  if (chaosEvent) {
    const divider = document.createElement('div');
    divider.style.cssText = 'border-top:1px solid var(--border);margin:0.6rem 0;';
    probEl.appendChild(divider);
    const row = document.createElement('div');
    row.className = 'problem-change created';
    row.style.fontStyle = 'italic';
    row.textContent = `Also: ${chaosEvent.message}`;
    probEl.appendChild(row);
  }

  document.getElementById('result-xp-gain').textContent = `+${xpEarned} XP`;
  syncXP();
  showScreen('result');
}

document.getElementById('btn-continue').addEventListener('click', () => showStatsScreen(lastResultDeltas));

// ── TRANSITION ────────────────────────────────────────────────────────────────

function showTransition(callback) {
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.remove('hidden');
  setTimeout(() => { overlay.classList.add('hidden'); callback(); }, 1000);
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

function showAdminScreen() {
  renderAdminAccounts();
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-admin').classList.add('active');
}

function renderAdminAccounts() {
  const data = getAccounts();
  const container = document.getElementById('admin-accounts');
  container.innerHTML = '';

  if (data.accounts.length === 0) {
    container.innerHTML = '<div class="admin-empty">No accounts yet.</div>';
    return;
  }

  data.accounts.forEach(account => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.innerHTML = `
      <div class="admin-row-info">
        <span class="admin-row-name">${account.name}</span>
        <span class="admin-row-meta">${account.xp} XP &nbsp;·&nbsp; ${account.timeTravels || 0} time travels &nbsp;·&nbsp; joined ${new Date(account.createdAt).toLocaleDateString()}</span>
      </div>
      <button class="btn-delete" data-name="${account.name}">Delete</button>
    `;
    row.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`Delete account "${account.name}"? This cannot be undone.`)) {
        deleteAccount(account.name);
        renderAdminAccounts();
      }
    });
    container.appendChild(row);
  });
}

function deleteAccount(name) {
  const data = getAccounts();
  data.accounts = data.accounts.filter(a => a.name.toLowerCase() !== name.toLowerCase());
  saveAccounts(data);
}

document.getElementById('btn-admin-back').addEventListener('click', () => {
  document.getElementById('screen-admin').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('name-input').value = '';
  loadAccountsPanel();
});

// ── LEADERBOARD ───────────────────────────────────────────────────────────────

function showLeaderboard() {
  const data = getAccounts();
  const sorted = [...data.accounts].sort((a, b) => b.xp - a.xp);
  const container = document.getElementById('leaderboard-list');
  container.innerHTML = '';

  if (sorted.length === 0) {
    container.innerHTML = '<div class="lb-empty">No travellers yet.</div>';
  } else {
    const medals = ['✦', '✧', '◆'];
    sorted.forEach((a, i) => {
      const row = document.createElement('div');
      row.className = 'lb-row' + (i < 3 ? ' lb-top' : '');
      row.innerHTML = `
        <span class="lb-rank${i < 3 ? ' gold' : ''}">${medals[i] || (i + 1) + '.'}</span>
        <span class="lb-name">${a.name}</span>
        <span class="lb-travels">${a.timeTravels || 0} travels</span>
        <span class="lb-xp">✦ ${a.xp} XP</span>
      `;
      container.appendChild(row);
    });
  }

  showScreen('leaderboard');
}

document.getElementById('btn-leaderboard').addEventListener('click', showLeaderboard);
document.getElementById('btn-lb-back').addEventListener('click', () => showScreen('login'));

// ── BOOT ──────────────────────────────────────────────────────────────────────

loadAccountsPanel();
