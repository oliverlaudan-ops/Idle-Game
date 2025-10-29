/* =========================
   From Stone to Civilization
   game.js – Clean Build
   ========================= */

// -------- Utilities --------
const fmt = n => {
  if (n === undefined || n === null) return '0';
  if (Math.abs(n) < 1000) return (+n).toFixed(n % 1 ? 2 : 0);
  const units = ['K','M','B','T'];
  let u = -1; let x = Math.abs(n);
  while (x >= 1000 && u < units.length - 1) { x /= 1000; u++; }
  return (n < 0 ? '-' : '') + x.toFixed(2) + units[u];
};

const pulse = el => {
  if (!el) return;
  el.classList.add('pulse');
  setTimeout(() => el.classList.remove('pulse'), 300);
};

// -------- Game State --------
const DEFAULT = {
  stein: 0, holz: 0, metall: 0,

  rpcStein: 1, rpcHolz: 0, rpcMetall: 0,
  rpsStein: 0, rpsHolz: 0, rpsMetall: 0,

  unlocks: { holz: false, metall: false },
  owned: {},

  totalStein: 0, totalHolz: 0, totalMetall: 0,

  tickMs: 1000
};

let state = JSON.parse(JSON.stringify(DEFAULT));
let prev  = { stein: 0, holz: 0, metall: 0 };

const SAVEKEY = 'stone_idle_save_v3';

// -------- Upgrades --------
// res = Währung zum Bezahlen
// requiresUnlock = welche Ressource vorher da sein muss, damit Karte sichtbar ist
// single = einmalig
// mult  = Preiswachstum
const upgrades = [
  // --- Stein ---
  { id:'faustkeil', group:'stein', res:'stein',
    name:'Faustkeil', desc:'+1 Stein/Klick', baseCost:10, mult:1.15,
    apply:s=>{ s.rpcStein += 1; } },

  { id:'steinspalter', group:'stein', res:'stein',
    name:'Steinspalter', desc:'+0.2 Stein/Sek', baseCost:30, mult:1.16,
    apply:s=>{ s.rpsStein += 0.2; } },

  { id:'arbeiter', group:'stein', res:'stein',
    name:'Arbeiter', desc:'+1 Stein/Sek', baseCost:120, mult:1.18,
    apply:s=>{ s.rpsStein += 1; } },

  { id:'steinmine', group:'stein', res:'stein',
    name:'Steinmine', desc:'+8 Stein/Sek', baseCost:520, mult:1.22,
    apply:s=>{ s.rpsStein += 8; } },

  // --- Holz freischalten ---
  { id:'werkbank', group:'holz', res:'stein', requiresUnlock:'stein',
    name:'Werkbank', desc:'Schaltet HOLZ frei', baseCost:625, mult:2.4, single:true,
    apply:s=>{ s.unlocks.holz = true; if (s.rpcHolz <= 0) s.rpcHolz = 1; } },

  // --- Holz Upgrades (kosten HOLZ) ---
  { id:'axt', group:'holz', res:'holz', requiresUnlock:'holz',
    name:'Axt', desc:'+1 Holz/Klick', baseCost:120, mult:1.22,
    apply:s=>{ s.rpcHolz += 1; } },

  { id:'holzfaeller', group:'holz', res:'holz', requiresUnlock:'holz',
    name:'Holzfäller', desc:'+0.8 Holz/Sek', baseCost:240, mult:1.22,
    apply:s=>{ s.rpsHolz += 0.8; } },

  { id:'saegewerk', group:'holz', res:'holz', requiresUnlock:'holz',
    name:'Sägewerk', desc:'+6 Holz/Sek', baseCost:520, mult:1.25,
    apply:s=>{ s.rpsHolz += 6; } },

  // --- Metall freischalten (KOSTET HOLZ) ---
  { id:'schmiede', group:'metall', res:'holz', requiresUnlock:'holz',
    name:'Schmiede', desc:'Schaltet METALL frei', baseCost:4400, mult:1.35, single:true,
    apply:s=>{ s.unlocks.metall = true; if (s.rpcMetall <= 0) s.rpcMetall = 1; } },

  // --- Metall Upgrades (kosten METALL) ---
  { id:'eisernePicke', group:'metall', res:'metall', requiresUnlock:'metall',
    name:'Eiserne Picke', desc:'+1 Metall/Klick', baseCost:1000, mult:1.22,
    apply:s=>{ s.rpcMetall += 1; } },

  { id:'bergwerk', group:'metall', res:'metall', requiresUnlock:'metall',
    name:'Bergwerk', desc:'+1.5 Metall/Sek', baseCost:2500, mult:1.24,
    apply:s=>{ s.rpsMetall += 1.5; } },

  { id:'giesserei', group:'metall', res:'metall', requiresUnlock:'metall',
    name:'Gießerei', desc:'+10 Metall/Sek', baseCost:12000, mult:1.28,
    apply:s=>{ s.rpsMetall += 10; } },
];

// -------- DOM Refs --------
const clickSteinBtn  = document.getElementById('steinBtn');
const clickHolzBtn   = document.getElementById('holzBtn');
const clickMetallBtn = document.getElementById('metallBtn');

// -------- Visibility / Filters --------
function isResourceUnlocked(res){
  if (res === 'stein')  return true;
  if (res === 'holz')   return !!state.unlocks.holz;
  if (res === 'metall') return !!state.unlocks.metall;
  return true;
}

// Unlock-Karten zeigen, sobald ihre Voraussetzung erfüllt ist
function shouldShow(upg){
  const isUnlocker = (upg.single && upg.res === 'holz' && upg.group === 'metall') || upg.id === 'werkbank';
  const unlockReqOk = !upg.requiresUnlock || !!state.unlocks[upg.requiresUnlock] || upg.requiresUnlock === 'stein';
  if (isUnlocker) return unlockReqOk;               // Schmiede/Werkbank sichtbar, wenn Voraussetzung erfüllt

  const byRes = isResourceUnlocked(upg.res);
  return byRes && unlockReqOk;
}

// -------- UI Builders --------
function buildCard(upg, owned, canBuy, resourceLabel, onBuy){
  const card = document.createElement('div');
  card.className = 'card-sm';

  const title = document.createElement('h3');
  title.textContent = upg.name;
  card.appendChild(title);

  const desc = document.createElement('div');
  desc.className = 'muted';
  desc.textContent = upg.desc;
  card.appendChild(desc);

  const cost = document.createElement('div');
  cost.className = 'muted';
  cost.textContent = `Kosten: ${fmt(getPrice(upg))} ${resourceLabel}`;
  card.appendChild(cost);

  const ownedEl = document.createElement('div');
  ownedEl.className = 'muted';
  ownedEl.textContent = `Besitz: ${owned}${upg.single ? ' (einmalig)' : ''}`;
  card.appendChild(ownedEl);

  const btn = document.createElement('button');
  btn.className = 'buy ' + (canBuy ? 'can' : 'cannot');
  btn.textContent = upg.single && owned > 0 ? 'Gekauft' : (canBuy ? 'Kaufen' : 'Nicht genug');
  btn.disabled = !canBuy || (upg.single && owned > 0);

  btn.addEventListener('click', ()=>{
    if (btn.disabled) return;
    onBuy();
  });
  card.appendChild(btn);

  return card;
}

function getPrice(upg){
  const owned = state.owned[upg.id] || 0;
  return Math.floor(upg.baseCost * Math.pow(upg.mult || 1, owned));
}

// -------- Rendering --------
function renderUpgrades(){
  const grid = document.getElementById('upgrade-grid');
  if (!grid) return;
  grid.innerHTML = '';

  upgrades.filter(shouldShow).forEach(upg => {
    const owned = state.owned[upg.id] || 0;
    const price = getPrice(upg);
    const pool  = upg.res === 'stein' ? state.stein
                : upg.res === 'holz'  ? state.holz
                : upg.res === 'metall'? state.metall : 0;

    const canBuy = pool >= price && (!upg.single || owned === 0);
    const card = buildCard(
      upg, owned, canBuy, upg.res.toUpperCase(),
      () => {
        // bezahlen
        if (upg.res === 'stein')  state.stein  -= price;
        if (upg.res === 'holz')   state.holz   -= price;
        if (upg.res === 'metall') state.metall -= price;

        // anwenden
        upg.apply(state);
        state.owned[upg.id] = owned + 1;

        // Buttons/Stats neu
        updateClickButtons();
        renderAll();
        save();
      }
    );
    grid.appendChild(card);
  });
}

const setText = (id, val) => {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
};

function renderStats(){
  // große Stats (falls genutzt)
  const steinStats = document.getElementById('steinStats');
  const holzStats  = document.getElementById('holzStats');
  const metallStats= document.getElementById('metallStats');

  if (steinStats)  steinStats.textContent  = `Stein: ${fmt(state.stein)} (+${fmt(state.rpsStein)}/s)`;
  if (holzStats)   holzStats.textContent   = `Holz: ${fmt(state.holz)} (+${fmt(state.rpsHolz)}/s)`;
  if (metallStats) metallStats.textContent = `Metall: ${fmt(state.metall)} (+${fmt(state.rpsMetall)}/s)`;

  // Statsbar oben
  setText('sbStein', fmt(state.stein));
  setText('sbHolz', fmt(state.holz));
  setText('sbSteinRate', `+${fmt(state.rpsStein)}/s`);
  setText('sbHolzRate', `+${fmt(state.rpsHolz)}/s`);
  setText('sbSteinClick', `+${fmt(state.rpcStein)}/click`);
  setText('sbHolzClick', `+${fmt(state.rpcHolz)}/click`);

  setText('sbMetall', fmt(state.metall));
  setText('sbMetallRate', `+${fmt(state.rpsMetall)}/s`);
  setText('sbMetallClick', `+${fmt(state.rpcMetall)}/click`);

  // Sichtbarkeit Metall-Statsbar-Block
  const mItem = document.getElementById('sbMetallItem');
  if (mItem) {
    if (state.unlocks.metall || state.rpcMetall > 0 || state.rpsMetall > 0) {
      mItem.style.display = '';
    } else {
      mItem.style.display = 'none';
    }
  }

  // Pulse bei Zuwachs
  const sItem = document.getElementById('sbSteinItem');
  const hItem = document.getElementById('sbHolzItem');
  if (state.stein  > prev.stein)  { pulse(sItem);  }
  if (state.holz   > prev.holz)   { pulse(hItem);  }
  if (state.metall > prev.metall) { pulse(mItem);  }
  prev = { stein: state.stein, holz: state.holz, metall: state.metall };

  // Tick/AUTOSAVE Badges (falls vorhanden)
  setText('sbTick',  `Tick ${(state.tickMs/1000).toFixed(1)}s`);
  setText('sbSave',  'Autosave');
}

function updateClickButtons(){
  if (clickSteinBtn)  clickSteinBtn.textContent  = `🪨 Stein sammeln (+${fmt(state.rpcStein)})`;

  if (state.unlocks.holz || state.rpcHolz > 0){
    clickHolzBtn.style.display = '';
    clickHolzBtn.textContent   = `🌲 Holz hacken (+${fmt(state.rpcHolz)})`;
  } else {
    clickHolzBtn.style.display = 'none';
  }

  if (state.unlocks.metall || state.rpcMetall > 0){
    clickMetallBtn.style.display = '';
    clickMetallBtn.textContent   = `⛏️ Metall abbauen (+${fmt(state.rpcMetall)})`;
  } else {
    clickMetallBtn.style.display = 'none';
  }
}

function renderAll(){
  renderStats();
  renderUpgrades();
}

// -------- Click Handlers --------
if (clickSteinBtn) {
  clickSteinBtn.addEventListener('click', ()=>{
    state.stein      += state.rpcStein;
    state.totalStein += state.rpcStein;
    renderAll();
  });
}

if (clickHolzBtn) {
  clickHolzBtn.addEventListener('click', ()=>{
    if (!state.unlocks.holz && state.rpcHolz<=0) return;
    state.holz      += state.rpcHolz;
    state.totalHolz += state.rpcHolz;
    renderAll();
  });
}

if (clickMetallBtn) {
  clickMetallBtn.addEventListener('click', ()=>{
    if (!state.unlocks.metall && state.rpcMetall<=0) return;
    state.metall      += state.rpcMetall;
    state.totalMetall += state.rpcMetall;
    renderAll();
  });
}

// -------- Tick Loop --------
let tickTimer = null;
function startTick(){
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(()=>{
    if (state.rpsStein   > 0) { state.stein   += state.rpsStein;   state.totalStein   += state.rpsStein; }
    if (state.rpsHolz    > 0) { state.holz    += state.rpsHolz;    state.totalHolz    += state.rpsHolz;  }
    if (state.rpsMetall  > 0) { state.metall  += state.rpsMetall;  state.totalMetall  += state.rpsMetall; }
    renderAll();
    save();
  }, state.tickMs);
}

// -------- Save / Load --------
function save(){
  try { localStorage.setItem(SAVEKEY, JSON.stringify(state)); } catch(e){}
}

function load(){
  try {
    const raw = localStorage.getItem(SAVEKEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    state = Object.assign({}, DEFAULT, obj);
  } catch(e){}
}

// -------- Init --------
document.addEventListener('DOMContentLoaded', ()=>{
  load();
  updateClickButtons();
  renderAll();
  startTick();
});
