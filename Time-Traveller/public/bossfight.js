(function () {
  'use strict';

  const CW = 820, CH = 420;
  const GRAV = 1600;

  // Arena platforms  {x, y, w, h}
  const PLATS = [
    { x: 0,   y: 372, w: 820, h: 48 }, // ground
    { x: 55,  y: 285, w: 145, h: 14 }, // left low
    { x: 340, y: 222, w: 140, h: 14 }, // centre mid
    { x: 620, y: 285, w: 145, h: 14 }, // right low
    { x: 135, y: 155, w: 125, h: 14 }, // left high
    { x: 560, y: 155, w: 125, h: 14 }, // right high
    { x: 318, y: 82,  w: 184, h: 14 }, // top centre  (boss spawn)
  ];

  let canvas, ctx, animId, running;
  let keys = {};
  let player, boss, projectiles, particles;
  let lastTime, gameOver, gameWon;

  // ── DERIVED STATS ──────────────────────────────────────────────────────────
  function ds() {
    return {
      maxHp:    stats.health,
      healRate: stats.healing / 60,          // hp per second
      speed:    70  + stats.speed    * 2.9,  // px/s
      jumpVel: -(255 + stats.agility * 7.0), // negative = upward
      damage:   3   + stats.strength * 0.52, // per swing
      maxStam:  stats.stamina,
    };
  }

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init() {
    canvas = document.getElementById('boss-canvas');
    canvas.width  = CW;
    canvas.height = CH;
    ctx = canvas.getContext('2d');

    const d = ds();

    player = {
      x: 55, y: 300, w: 28, h: 44,
      vx: 0, vy: 0, prevY: 300,
      hp: d.maxHp, maxHp: d.maxHp,
      stam: d.maxStam, maxStam: d.maxStam,
      facing: 1, onGround: false,
      stamEx: false, stamTimer: 0,
      atkCd: 0, atkActive: false, atkTimer: 0, atkHit: false,
      iframes: 0,
    };

    boss = {
      x: 356, y: 16, w: 64, h: 84,
      vx: 0, vy: 0, prevY: 16,
      hp: 600, maxHp: 600,
      onGround: false,
      phase: 1,
      state: 'idle', stTimer: 1.8,
      atkCd: 0, projCd: 0,
      facing: -1,
      flash: 0,
      chargeVx: 0,
    };

    projectiles = [];
    particles   = [];
    keys        = {};
    gameOver    = false;
    gameWon     = false;
    lastTime    = null;

    document.removeEventListener('keydown', onDown);
    document.removeEventListener('keyup',   onUp);
    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup',   onUp);

    if (animId) cancelAnimationFrame(animId);
    running = true;
    animId  = requestAnimationFrame(loop);
  }

  function onDown(e) {
    keys[e.key.toLowerCase()] = true;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase()))
      e.preventDefault();
  }
  function onUp(e) { keys[e.key.toLowerCase()] = false; }

  // ── MAIN LOOP ──────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!running) return;
    if (!lastTime) lastTime = ts;
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    render();
    animId = requestAnimationFrame(loop);
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  function update(dt) {
    if (gameOver || gameWon) return;
    updatePlayer(dt);
    updateBoss(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    checkEnd();
  }

  // ── PLAYER ─────────────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    const d = ds();

    // Stamina recovery
    if (player.stamEx) {
      player.stamTimer -= dt;
      if (player.stamTimer <= 0) {
        player.stam  = player.maxStam;
        player.stamEx = false;
      }
    }

    // Horizontal
    const goLeft  = keys['a'] || keys['arrowleft'];
    const goRight = keys['d'] || keys['arrowright'];
    const moving  = (goLeft || goRight) && !player.stamEx;

    if (goLeft && !player.stamEx) {
      player.vx = -d.speed; player.facing = -1;
    } else if (goRight && !player.stamEx) {
      player.vx =  d.speed; player.facing =  1;
    } else {
      player.vx *= 0.72;
      if (Math.abs(player.vx) < 4) player.vx = 0;
    }

    // Stamina drain / passive regen
    if (moving) {
      player.stam = Math.max(0, player.stam - 11 * dt);
      if (player.stam === 0) { player.stamEx = true; player.stamTimer = 5; player.vx = 0; }
    } else if (!player.stamEx) {
      player.stam = Math.min(player.maxStam, player.stam + 6 * dt);
    }

    // Jump
    if ((keys[' '] || keys['w'] || keys['arrowup']) && player.onGround) {
      player.vy = d.jumpVel;
      player.onGround = false;
      burst(player.x + player.w / 2, player.y + player.h, 5, '#c9a050', 55);
    }

    // Attack
    player.atkCd = Math.max(0, player.atkCd - dt);
    if (player.atkActive) {
      player.atkTimer -= dt;
      if (!player.atkHit) {
        const hx = player.facing === 1 ? player.x + player.w : player.x - 56;
        if (overlap({ x: hx, y: player.y + 6, w: 56, h: 36 }, boss)) {
          const dmg = d.damage * (0.85 + Math.random() * 0.3);
          boss.hp    = Math.max(0, boss.hp - dmg);
          boss.flash = 0.18;
          boss.vx   += player.facing * 110;
          player.atkHit = true;
          burst(boss.x + boss.w / 2, boss.y + boss.h / 3, 9, '#ff5533', 130);
        }
      }
      if (player.atkTimer <= 0) player.atkActive = false;
    }

    if (keys['j'] && player.atkCd === 0 && !player.stamEx) {
      player.atkActive = true; player.atkTimer = 0.20;
      player.atkHit    = false; player.atkCd   = 0.42;
      player.stam = Math.max(0, player.stam - 12);
    }

    // Passive healing (stat/60 hp/sec)
    if (player.hp < player.maxHp)
      player.hp = Math.min(player.maxHp, player.hp + d.healRate * dt);

    // Iframes
    player.iframes = Math.max(0, player.iframes - dt);

    // Physics
    player.prevY  = player.y;
    player.vy     = Math.min(player.vy + GRAV * dt, 980);
    player.x     += player.vx * dt;
    player.y     += player.vy * dt;

    player.onGround = false;
    for (const p of PLATS) if (platCollide(player, p)) player.onGround = true;

    player.x = clamp(player.x, 0, CW - player.w);
    if (player.y > CH + 60) player.hp = 0; // fell off
  }

  // ── BOSS AI ────────────────────────────────────────────────────────────────
  function updateBoss(dt) {
    // Phase gate
    const pct = boss.hp / boss.maxHp;
    if (pct <= 0.3 && boss.phase < 3) {
      boss.phase = 3; boss.state = 'roar'; boss.stTimer = 1.8;
      burst(boss.x + boss.w / 2, boss.y + boss.h / 2, 28, '#ff1100', 220);
    } else if (pct <= 0.6 && boss.phase < 2) {
      boss.phase = 2; boss.state = 'roar'; boss.stTimer = 1.3;
      burst(boss.x + boss.w / 2, boss.y + boss.h / 2, 18, '#ff6600', 160);
    }

    boss.atkCd   = Math.max(0, boss.atkCd  - dt);
    boss.projCd  = Math.max(0, boss.projCd - dt);
    boss.flash   = Math.max(0, boss.flash  - dt * 6);
    boss.stTimer -= dt;

    const spd = boss.phase === 3 ? 215 : boss.phase === 2 ? 150 : 105;
    const pdx  = (player.x + player.w / 2) - (boss.x + boss.w / 2);
    boss.facing = pdx >= 0 ? 1 : -1;

    if (boss.state === 'roar') {
      boss.vx *= 0.9;
      if (boss.stTimer <= 0) { boss.state = 'idle'; boss.stTimer = 0.3; }
      return;
    }

    if (boss.state === 'idle') {
      boss.vx *= 0.82;
      if (boss.stTimer > 0) return;

      const dist = Math.abs(pdx);
      const r    = Math.random();

      if (dist < 95 && boss.atkCd === 0) {
        boss.state = 'melee'; boss.stTimer = boss.phase === 3 ? 0.22 : 0.32;
        boss.atkCd = boss.phase === 3 ? 0.50 : 0.85;
      } else if (boss.phase >= 2 && boss.projCd === 0 && r < 0.38) {
        boss.state = 'shoot'; boss.stTimer = 0.42;
      } else if (boss.phase >= 2 && r < 0.58) {
        boss.state = 'charge'; boss.chargeVx = boss.facing * (boss.phase === 3 ? 540 : 390);
        boss.stTimer = boss.phase === 3 ? 0.52 : 0.72;
      } else if (r < 0.68 && boss.onGround) {
        boss.state = 'jump'; boss.stTimer = 0.14;
      } else {
        boss.state = 'walk'; boss.stTimer = 0.45 + Math.random() * 0.5;
      }
    }

    else if (boss.state === 'walk') {
      boss.vx = boss.facing * spd;
      if (boss.stTimer <= 0) { boss.state = 'idle'; boss.stTimer = 0.22; }
    }

    else if (boss.state === 'charge') {
      boss.vx = boss.chargeVx;
      if (overlap(boss, player)) {
        hurtPlayer(boss.phase === 3 ? 58 : 40);
        boss.vx = 0; boss.state = 'idle'; boss.stTimer = 0.5;
      }
      if (boss.stTimer <= 0) { boss.vx = 0; boss.state = 'idle'; boss.stTimer = 0.4; }
    }

    else if (boss.state === 'jump') {
      if (boss.onGround) boss.vy = -(640 + boss.phase * 90);
      boss.state = 'idle'; boss.stTimer = 0.28;
    }

    else if (boss.state === 'melee') {
      boss.vx *= 0.65;
      if (boss.stTimer <= 0) {
        const hx = boss.facing === 1 ? boss.x + boss.w - 4 : boss.x - 66;
        if (overlap({ x: hx, y: boss.y + 10, w: 70, h: 58 }, player))
          hurtPlayer(boss.phase === 3 ? 50 : boss.phase === 2 ? 36 : 25);
        boss.state = 'idle'; boss.stTimer = 0.24;
      }
    }

    else if (boss.state === 'shoot') {
      boss.vx *= 0.78;
      if (boss.stTimer <= 0) {
        fireAt(0);
        if (boss.phase >= 2) { setTimeout(() => running && fireAt(-20), 140); }
        if (boss.phase === 3) { setTimeout(() => running && fireAt(20), 280); }
        boss.projCd = boss.phase === 3 ? 1.1 : 2.0;
        boss.state  = 'idle'; boss.stTimer = 0.5;
      }
    }

    // Passive contact damage (not during charge – handled above)
    if (boss.state !== 'charge' && overlap(boss, player) && player.iframes === 0)
      hurtPlayer(9 * dt * (boss.phase === 3 ? 1.6 : 1));

    // Physics
    boss.prevY = boss.y;
    boss.vy    = Math.min(boss.vy + GRAV * dt, 980);
    boss.x    += boss.vx * dt;
    boss.y    += boss.vy * dt;

    boss.onGround = false;
    for (const p of PLATS) if (platCollide(boss, p)) boss.onGround = true;

    boss.x = clamp(boss.x, 0, CW - boss.w);
    if (boss.y > CH + 80) { boss.y = 16; boss.vy = 0; }
  }

  function hurtPlayer(dmg) {
    if (player.iframes > 0) return;
    player.hp      = Math.max(0, player.hp - dmg);
    player.iframes = 0.35;
    burst(player.x + player.w / 2, player.y + player.h / 2, 7, '#ff3344', 105);
    const dir = player.x + player.w / 2 > boss.x + boss.w / 2 ? 1 : -1;
    player.vx = dir * 230; player.vy = -270;
  }

  function fireAt(angleOff) {
    const bx = boss.x + boss.w / 2, by = boss.y + boss.h / 2;
    const ang = Math.atan2(
      (player.y + player.h / 2) - by,
      (player.x + player.w / 2) - bx
    ) + angleOff * Math.PI / 180;
    const spd = 270 + boss.phase * 52;
    projectiles.push({
      x: bx, y: by,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      r: 8, life: 4,
      dmg: boss.phase === 3 ? 32 : 22,
    });
    burst(bx, by, 5, '#ff7700', 85);
  }

  // ── PROJECTILES ────────────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += GRAV * 0.14 * dt;
      p.life -= dt;

      if (overlap({ x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }, player)
          && player.iframes === 0) {
        hurtPlayer(p.dmg);
        burst(p.x, p.y, 7, '#ff6600', 90);
        projectiles.splice(i, 1); continue;
      }

      let gone = p.life <= 0 || p.x < -10 || p.x > CW + 10 || p.y > CH + 10;
      if (!gone)
        for (const pl of PLATS)
          if (p.x > pl.x && p.x < pl.x + pl.w && p.y > pl.y && p.y < pl.y + pl.h) { gone = true; break; }
      if (gone) { burst(p.x, p.y, 4, '#cc5500', 60); projectiles.splice(i, 1); }
    }
  }

  // ── PARTICLES ──────────────────────────────────────────────────────────────
  function burst(x, y, n, color, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (0.3 + Math.random() * 0.7) * spd;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.22,
        life: 0.22 + Math.random() * 0.42, color, r: 1.5 + Math.random() * 2.8,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += GRAV * 0.28 * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function platCollide(e, p) {
    const bot  = e.y + e.h;
    const prev = e.prevY + e.h;
    if (e.vy >= -6 && prev <= p.y + 10 && bot >= p.y
        && e.x + e.w > p.x + 4 && e.x < p.x + p.w - 4) {
      e.y = p.y - e.h; e.vy = 0;
      return true;
    }
    return false;
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ── WIN / LOSE ─────────────────────────────────────────────────────────────
  function checkEnd() {
    if (boss.hp   <= 0 && !gameWon)  { gameWon  = true; endFight(true);  }
    if (player.hp <= 0 && !gameOver) { gameOver = true; endFight(false); }
  }

  function endFight(won) {
    running = false;
    cancelAnimationFrame(animId);
    document.removeEventListener('keydown', onDown);
    document.removeEventListener('keyup',   onUp);

    const ov = document.getElementById('boss-overlay');
    ov.classList.remove('hidden');

    if (won) {
      const xp = 200 + Math.floor(Math.random() * 100);
      totalXP += xp;
      persistProgress();
      ov.innerHTML = `
        <div class="boss-end won">
          <div class="boss-end-title">VICTORY</div>
          <div class="boss-end-sub">The boss has fallen. The timeline is yours.</div>
          <div class="boss-end-xp">+${xp} XP</div>
          <button class="btn-primary" id="btn-boss-end">Continue</button>
        </div>`;
    } else {
      STAT_NAMES.forEach(s => { stats[s] = Math.max(1, stats[s] - (2 + Math.floor(Math.random() * 5))); });
      ov.innerHTML = `
        <div class="boss-end lost">
          <div class="boss-end-title">DEFEATED</div>
          <div class="boss-end-sub">Your stats took a hit. Travel back and prepare better.</div>
          <button class="btn-primary" id="btn-boss-end">Try Again</button>
        </div>`;
    }

    document.getElementById('btn-boss-end').addEventListener('click', () => {
      ov.classList.add('hidden');
      showStatsScreen(null);
    });
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  function render() {
    // Sky
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, '#100c08'); bg.addColorStop(0.6, '#1c1208'); bg.addColorStop(1, '#2e1106');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);

    // Lava glow
    const lava = ctx.createLinearGradient(0, CH - 90, 0, CH);
    lava.addColorStop(0, 'rgba(200,55,0,0)'); lava.addColorStop(1, 'rgba(255,95,0,0.42)');
    ctx.fillStyle = lava; ctx.fillRect(0, CH - 90, CW, 90);

    drawDecor();

    for (const p of PLATS) drawPlat(p);

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2.8);
      ctx.fillStyle   = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Projectiles
    for (const p of projectiles) {
      ctx.save();
      ctx.shadowColor = '#ff7700'; ctx.shadowBlur = 14;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, '#ffee00'); g.addColorStop(1, '#ff3300');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawPlayer();
    drawBoss();
    drawHUD();
  }

  function drawDecor() {
    const t = Date.now() / 180;
    // Background pillars
    [70, CW - 70].forEach(px => {
      ctx.fillStyle = '#1c1610';
      ctx.fillRect(px - 12, 0, 24, CH);
      ctx.fillStyle = '#2c2218';
      ctx.fillRect(px - 10, 0, 5, CH);
      // Torch glow
      const fl = 0.7 + Math.sin(t + px * 0.01) * 0.3;
      ctx.save();
      ctx.shadowColor = `rgba(255,130,0,${fl})`; ctx.shadowBlur = 28 * fl;
      ctx.fillStyle   = `rgba(255,175,0,${fl})`;
      ctx.beginPath(); ctx.arc(px, 65, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    // Far background chains (decorative lines)
    ctx.strokeStyle = 'rgba(80,60,30,0.25)'; ctx.lineWidth = 2;
    [200, 420, 640].forEach(px => {
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px + 15, CH * 0.4); ctx.stroke();
    });
  }

  function drawPlat(p) {
    ctx.fillStyle = '#26201a'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#3e3228'; ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = 'rgba(201,160,80,0.07)'; ctx.fillRect(p.x, p.y, p.w, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    for (let i = 32; i < p.w; i += 32) {
      ctx.beginPath(); ctx.moveTo(p.x + i, p.y); ctx.lineTo(p.x + i, p.y + p.h); ctx.stroke();
    }
  }

  function drawPlayer() {
    const p = player;
    if (p.iframes > 0 && Math.floor(p.iframes * 12) % 2 === 0) return;
    ctx.save();

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + p.h + 2, p.w / 2, 5, 0, 0, Math.PI * 2); ctx.fill();

    // Boots
    ctx.fillStyle = '#6a5020';
    ctx.fillRect(p.x + 3,       p.y + p.h - 13, 10, 13);
    ctx.fillRect(p.x + p.w - 13, p.y + p.h - 13, 10, 13);

    // Body
    ctx.fillStyle = p.stamEx ? '#5a4715' : '#b88c35';
    ctx.fillRect(p.x + 5, p.y + 17, p.w - 10, p.h - 30);

    // Gold scarf
    ctx.fillStyle = '#c9a050';
    ctx.fillRect(p.x + 4, p.y + 17, p.w - 8, 5);

    // Head
    ctx.fillStyle = '#c8a845';
    ctx.fillRect(p.x + 3, p.y, p.w - 6, 19);

    // Eye
    ctx.fillStyle = '#111';
    ctx.fillRect(p.facing === 1 ? p.x + p.w - 12 : p.x + 6, p.y + 6, 4, 4);

    // Attack arc
    if (p.atkActive) {
      ctx.strokeStyle = '#ffe044'; ctx.lineWidth = 3;
      ctx.shadowColor = '#ffe044'; ctx.shadowBlur = 10;
      const sx = p.facing === 1 ? p.x + p.w + 2 : p.x - 2;
      ctx.beginPath();
      ctx.arc(sx, p.y + p.h / 2, 36,
        p.facing === 1 ? -Math.PI * 0.6 :  Math.PI * 0.4,
        p.facing === 1 ?  Math.PI * 0.6 :  Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBoss() {
    const b    = boss;
    const pcol = b.phase === 3 ? '#ff1000' : b.phase === 2 ? '#ff6500' : '#cc3000';
    ctx.save();

    if (b.phase >= 2) { ctx.shadowColor = pcol; ctx.shadowBlur = 18 + Math.sin(Date.now() / 170) * 9; }
    if (b.flash > 0)   ctx.globalAlpha = 0.45 + (b.flash * 8 % 1) * 0.55;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h + 3, b.w / 2 + 4, 7, 0, 0, Math.PI * 2); ctx.fill();

    // Legs
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#280e0e';
    ctx.fillRect(b.x + 8,       b.y + b.h - 18, 20, 18);
    ctx.fillRect(b.x + b.w - 28, b.y + b.h - 18, 20, 18);

    // Body
    ctx.fillStyle = '#190808';
    ctx.fillRect(b.x + 6, b.y + 22, b.w - 12, b.h - 30);
    ctx.fillStyle = '#2c1212';
    ctx.fillRect(b.x + 11, b.y + 27, b.w - 22, b.h - 46);

    // Shoulder pads
    ctx.fillStyle = '#3e1a1a';
    ctx.fillRect(b.x - 2, b.y + 22, 14, 24);
    ctx.fillRect(b.x + b.w - 12, b.y + 22, 14, 24);

    // Claws
    ctx.fillStyle = '#501818';
    ctx.fillRect(b.x - 10, b.y + b.h - 30, 14, 24);
    ctx.fillRect(b.x + b.w - 4, b.y + b.h - 30, 14, 24);

    // Head
    ctx.fillStyle = '#220808';
    ctx.fillRect(b.x + 2, b.y, b.w - 4, 24);

    // Horns
    if (b.phase >= 2) { ctx.shadowColor = pcol; ctx.shadowBlur = 10; }
    ctx.fillStyle = pcol;
    ctx.beginPath(); ctx.moveTo(b.x + 10, b.y); ctx.lineTo(b.x + 16, b.y - 22); ctx.lineTo(b.x + 26, b.y); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.x + b.w - 10, b.y); ctx.lineTo(b.x + b.w - 16, b.y - 22); ctx.lineTo(b.x + b.w - 26, b.y); ctx.fill();

    // Eyes
    ctx.fillStyle = pcol; ctx.shadowColor = pcol; ctx.shadowBlur = 14;
    ctx.fillRect(b.x + 8,       b.y + 6, 13, 10);
    ctx.fillRect(b.x + b.w - 21, b.y + 6, 13, 10);

    // Phase 3 cracks
    if (b.phase === 3) {
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,40,0,0.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(b.x + b.w/2 - 3, b.y + 4); ctx.lineTo(b.x + b.w/2 + 7, b.y + 14);
      ctx.lineTo(b.x + b.w/2 - 1, b.y + 24); ctx.stroke();
    }

    ctx.restore();
  }

  function drawHUD() {
    const H = 13;

    // ── Player HP ──
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(10, 10, 180, H);
    const hpPct = player.hp / player.maxHp;
    ctx.fillStyle = hpPct > 0.5 ? '#44bb44' : hpPct > 0.25 ? '#cc8822' : '#bb2222';
    ctx.fillRect(10, 10, 180 * hpPct, H);
    ctx.strokeStyle = '#484030'; ctx.lineWidth = 1; ctx.strokeRect(10, 10, 180, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Courier New';
    ctx.fillText(`HP  ${Math.ceil(player.hp)} / ${player.maxHp}`, 15, 21);

    // ── Stamina ──
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(10, 27, 180, 9);
    ctx.fillStyle = player.stamEx ? '#664400' : '#c9a050';
    ctx.fillRect(10, 27, 180 * (player.stam / player.maxStam), 9);
    ctx.strokeStyle = '#484030'; ctx.strokeRect(10, 27, 180, 9);
    ctx.fillStyle = '#bbb'; ctx.font = '8px Courier New';
    ctx.fillText(player.stamEx ? `EXHAUSTED  ${Math.ceil(player.stamTimer)}s` : 'STAMINA', 14, 34);

    // ── Boss HP ──
    const bw = 240, bx = CW - bw - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(bx, 10, bw, H);
    const bpct = boss.hp / boss.maxHp;
    ctx.fillStyle = boss.phase === 3 ? '#ff1000' : boss.phase === 2 ? '#dd3800' : '#cc2000';
    ctx.fillRect(bx, 10, bw * bpct, H);
    ctx.strokeStyle = '#484030'; ctx.strokeRect(bx, 10, bw, H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Courier New';
    ctx.fillText(`BOSS   ${Math.ceil(boss.hp)} / ${boss.maxHp}`, bx + 7, 21);

    // Phase label
    ctx.fillStyle = boss.phase === 3 ? '#ff2200' : boss.phase === 2 ? '#ff6600' : '#cc4444';
    ctx.font      = 'bold 9px Courier New';
    ctx.fillText(['', 'PHASE I', 'PHASE II', 'PHASE III'][boss.phase], bx, 37);

    // Controls hint
    ctx.fillStyle  = 'rgba(255,255,255,0.2)'; ctx.font = '8px Courier New';
    ctx.textAlign  = 'center';
    ctx.fillText('WASD / Space: Move & Jump     J: Attack', CW / 2, CH - 5);
    ctx.textAlign  = 'left';
  }

  window.initBossFight = init;
})();
