/* ==========================================================
   From Stone to Civilization – game.js (Dynamic Clean Build)
   ========================================================== */

/* ------------------ Utils ------------------ */
const SAVEKEY = 'stone_idle_save_dyn_v1';

const fmt = n => {
  if (n == null) return '0';
  const abs = Math.abs(n);
  if (abs < 1000) return (Math.round(n * 100) / 100).toString();
  const units = ['K','M','B','T','Qa','Qi'];
  let u = -1, x = abs;
  while (x >= 1000 && u < units.length - 1) { x /= 1000; u++; }
  return (n < 0 ? '-' : '') + x.toFixed(2) + units[u];
};
const clamp0 = v => (v < 0 ? 0 : v);
const getEl = id => document.getElementById(id);

/* ------------------ Dynamic Resources ------------------ */
/**
 * Jede Ressource, die du später ergänzen willst, einfach hier anhängen.
 * key  = State-Schlüssel (z.B. "stein")
 * icon = Emoji/kurzes Symbol
 * label= Anzeigename
 * unlockedBy = id eines Unlock-Upgrades (optional); wenn leer, zu Beginn sichtbar
 */
const RESOURCES = [
  { key: 'stein',  icon: '🪨', label: 'Stein',  unlockedBy: null,  startRpc: 1 },
  { key: 'holz',   icon: '🌲', label: 'Holz',   unlockedBy: 'werkbank', startRpc: 1 },
  { key: 'metall', icon: '⛏️', label: 'Metall', unlockedBy: 'schmiede', startRpc: 1 },
  // Beispiel für später:
  // { key: 'erz', icon: '🪨', label:'Erz', unlockedBy:'bergbauForschung', startRpc: 1 },
];

/* ------------------ Game State ------------------ */
const DEFAULT = {
  tickMs: 1000,
  // Prestige-Prototyp
  ep: 0,                // Erkenntnispunkte
  prestigeTimes: 0,     // wie oft Prestige ausgelöst
  // intern gefüllt:
  owned: {},            // Upgrade-Besitz
  unlocks: {},          // Upgrades/Ressourcen-Flags
  effMult: 1,            // <— NEU: globaler Effizienz-Multiplikator (Ofen)
};
// dynamisch Felder für alle Ressourcen anlegen
RESOURCES.forEach(r => {
  DEFAULT[r.key] = 0;
  DEFAULT['rpc_'+r.key] = (r.startRpc ?? 0) * (r.unlockedBy ? 0 : 1); // wenn Start-RPC erst nach Unlock gelten soll
  DEFAULT['rps_'+r.key] = 0;
  DEFAULT['unl_'+r.key] = !r.unlockedBy; // sichtbar, wenn kein Unlock benötigt
});

let state = JSON.parse(JSON.stringify(DEFAULT));
let prev  = Object.fromEntries(RESOURCES.map(r => [r.key, 0]));

/* ------------------ Upgrades ------------------ */
/**
 * Upgrade-Felder:
 * id: eindeutige Kennung
 * res: womit bezahlt wird (z.B. "stein", "holz", "metall")
 * requiresUnlock: welche Ressource freigeschaltet sein muss, damit die Karte sichtbar ist
 * single: true = einmalig
 * baseCost, mult: Preisformel
 * apply: (s) => { ... } Effekt
 */
const upgrades = [
  // --- Stein-Kette ---
  { id:'faustkeil', res:'stein', name:'Faustkeil', desc:'+1 Stein/Klick', baseCost:10,  mult:1.15,
    apply:s=>{ s['rpc_stein'] += 1; } },
  { id:'steinspalter', res:'stein', name:'Steinspalter', desc:'+0.2 Stein/Sek', baseCost:30, mult:1.16,
    apply:s=>{ s['rps_stein'] += 0.2; } },
  { id:'arbeiter', res:'stein', name:'Arbeiter', desc:'+1 Stein/Sek', baseCost:120, mult:1.18,
    apply:s=>{ s['rps_stein'] += 1; } },
  { id:'steinmine', res:'stein', name:'Steinmine', desc:'+8 Stein/Sek', baseCost:520, mult:1.22,
    apply:s=>{ s['rps_stein'] += 8; } },

  // --- Holz freischalten (bezahlt mit Stein) ---
  { id:'werkbank', res:'stein', requiresUnlock:'stein', single:true,
    name:'Werkbank', desc:'Schaltet HOLZ frei', baseCost:625, mult:2.4,
    apply:s=>{
      s['unl_holz'] = true;
      if (s['rpc_holz'] <= 0) s['rpc_holz'] = 1;
    } },

  // --- Holz-Upgrades (kosten Holz) ---
  { id:'axt', res:'holz', requiresUnlock:'holz', name:'Axt', desc:'+1 Holz/Klick', baseCost:120, mult:1.22,
    apply:s=>{ s['rpc_holz'] += 1; } },
  { id:'holzfaeller', res:'holz', requiresUnlock:'holz', name:'Holzfäller', desc:'+0.8 Holz/Sek', baseCost:240, mult:1.22,
    apply:s=>{ s['rps_holz'] += 0.8; } },
  { id:'saegewerk', res:'holz', requiresUnlock:'holz', name:'Sägewerk', desc:'+6 Holz/Sek', baseCost:520, mult:1.25,
    apply:s=>{ s['rps_holz'] += 6; } },
   // --- Globaler Effizienz-Buff (kostet Holz) ---
  { id: 'ofen', res: 'holz', requiresUnlock: 'holz', name: 'Ofen', desc: 'Effizienz +10% global', baseCost: 1500, mult: 1.35, 
  apply: s => { s.effMult = +(s.effMult * 1.10).toFixed(6); } }
   
  // --- Metall freischalten (bezahlt mit Holz) ---
  { id:'schmiede', res:'holz', requiresUnlock:'holz', single:true,
    name:'Schmiede', desc:'Schaltet METALL frei', baseCost:4400, mult:1.35,
    apply:s=>{
      s['unl_metall'] = true;
      if (s['rpc_metall'] <= 0) s['rpc_metall'] = 1;
    } },

  // --- Metall-Upgrades (kosten Metall) ---
  { id:'eisernePicke', res:'metall', requiresUnlock:'metall', name:'Eiserne Picke', desc:'+1 Metall/Klick', baseCost:1000, mult:1.22,
    apply:s=>{ s['rpc_metall'] += 1; } },
  { id:'bergwerk', res:'metall', requiresUnlock:'metall', name:'Bergwerk', desc:'+1.5 Metall/Sek', baseCost:2500, mult:1.24,
    apply:s=>{ s['rps_metall'] += 1.5; } },
  { id:'giesserei', res:'metall', requiresUnlock:'metall', name:'Gießerei', desc:'+10 Metall/Sek', baseCost:12000, mult:1.28,
    apply:s=>{ s['rps_metall'] += 10; } },
];

/* ------------------ DOM Refs ------------------ */
const elUpgradeGrid = getEl('upgrade-grid');
const elActions     = getEl('actions');
const elSbItemsWrap = getEl('sbItems') || getEl('sbBar'); // fallback: falls nur sbBar existiert
const elPrestigeBtn = getEl('prestigeBtn');
const elPrestigeReq = getEl('prestigeReq');

/* ------------------ Helpers ------------------ */
const getPrice = u => Math.floor(u.baseCost * Math.pow(u.mult || 1, (state.owned[u.id] || 0)));
const resUnlocked = resKey => resKey === 'stein' ? true : !!state['unl_'+resKey];
const canShowUpgrade = u => {
  // Normale Sichtbarkeit: Ressource muss freigeschaltet sein
  const reqOk = !u.requiresUnlock || resUnlocked(u.requiresUnlock);
  if (!reqOk) return false;
  // Bezahleressource sichtbar?
  if (!resUnlocked(u.res)) {
    // Ausnahme: Unlock-Upgrade (single), das Ressource freischaltet (Werkbank/Schmiede)
    return !!u.single; 
  }
  return true;
};
const pay = (resKey, amount) => { state[resKey] = clamp0(state[resKey] - amount); };

/* ------------------ Statsbar (dynamic) ------------------ */
// Erzeugt ID, die zu deiner CSS passt, für Hauptressourcen
function pillIdFor(key){
  if (key === 'stein')  return 'sbSteinItem';
  if (key === 'holz')   return 'sbHolzItem';
  if (key === 'metall') return 'sbMetallItem';
  return 'sbItem_'+key;  // generisch für zukünftige Ressourcen
}
function mainValIdFor(key){ return key === 'stein' ? 'sbStein' : key === 'holz' ? 'sbHolz' : key === 'metall' ? 'sbMetall' : `sb_${key}`; }
function rateIdFor(key){ return key === 'stein' ? 'sbSteinRate' : key === 'holz' ? 'sbHolzRate' : key === 'metall' ? 'sbMetallRate' : `sb_${key}_rate`; }
function clickIdFor(key){ return key === 'stein' ? 'sbSteinClick' : key === 'holz' ? 'sbHolzClick' : key === 'metall' ? 'sbMetallClick' : `sb_${key}_click`; }

function renderStatsBar(){
  if (!elSbItemsWrap) return;

  // Wenn sbItems-Container existiert, verwenden wir ihn, sonst sbBar selbst.
  const wrap = elSbItemsWrap.id === 'sbItems' ? elSbItemsWrap : elSbItemsWrap;

  // Nur die Ressourcen-Pills neu rendern (nicht den rechten Block)
  // -> Wenn sbItems existiert, rendern wir rein; wenn nicht, rendern wir direkt vor .sb-right
  let targetWrap = wrap;
  if (wrap.id !== 'sbItems') {
    // in sbBar suchen wir .sb-right und fügen vor ihr die Pills ein
    const right = document.querySelector('#sbBar .sb-right');
    // Wir löschen alle vorhandenen .sb-item in sbBar
    document.querySelectorAll('#sbBar .sb-item').forEach(n => n.remove());
    targetWrap = getEl('sbBar');
    if (!targetWrap) return;
  } else {
    wrap.innerHTML = '';
  }

  RESOURCES.filter(r => state['unl_'+r.key]).forEach(r => {
    const pill = document.createElement('div');
    pill.className = 'sb-item';
    pill.id = pillIdFor(r.key);

    // Hauptwert
    const main = document.createElement('span');
    main.id = mainValIdFor(r.key);
    main.textContent = fmt(state[r.key]);

    // Subchips
    const rate = document.createElement('span');
    rate.id = rateIdFor(r.key);
    rate.textContent = `+${fmt(state['rps_'+r.key])}/s`;

    const click = document.createElement('span');
    click.id = clickIdFor(r.key);
    click.textContent = `+${fmt(state['rpc_'+r.key])}/click`;

    // zusammenbauen
    pill.appendChild(main);
    pill.appendChild(rate);
    pill.appendChild(click);

    // Wenn wir direkt in sbBar rendern, fügen wir VOR dem rechten Block ein
    const right = document.querySelector('#sbBar .sb-right');
    if (right && targetWrap === getEl('sbBar')) {
      targetWrap.insertBefore(pill, right);
    } else {
      targetWrap.appendChild(pill);
    }
  });
}

function updateStatsBar(){
  RESOURCES.filter(r => state['unl_'+r.key]).forEach(r => {
    const mainId  = mainValIdFor(r.key);
    const rateId  = rateIdFor(r.key);
    const clickId = clickIdFor(r.key);
    const main  = getEl(mainId);
    const rate  = getEl(rateId);
    const click = getEl(clickId);
    if (main)  main.textContent  = fmt(state[r.key]);
    if (rate)  rate.textContent  = `+${fmt(state['rps_'+r.key])}/s`;
    if (click) click.textContent = `+${fmt(state['rpc_'+r.key])}/click`;

    // Pulse bei Anstieg
    const pill = getEl(pillIdFor(r.key));
    if (pill && state[r.key] > (prev[r.key] ?? 0)) {
      pill.classList.remove('pulse'); void pill.offsetWidth; pill.classList.add('pulse');
    }
    prev[r.key] = state[r.key];
  });

  // Meta rechts (falls vorhanden)
  const tick = getEl('sbTick'); if (tick) tick.textContent = `Tick ${(state.tickMs/1000).toFixed(1)}s`;
  const save = getEl('sbSave'); if (save) save.textContent = 'Autosave';
}

/* ------------------ Action Buttons (dynamic) ------------------ */
function btnIdFor(key){
  if (key === 'stein')  return 'steinBtn';
  if (key === 'holz')   return 'holzBtn';
  if (key === 'metall') return 'metallBtn';
  return 'btn_'+key;
}

function renderActionButtons(){
  if (!elActions) return;
  elActions.innerHTML = '';
  RESOURCES.filter(r => state['unl_'+r.key]).forEach(r => {
    const btn = document.createElement('button');
    btn.id = btnIdFor(r.key);
    btn.textContent = `${r.icon ?? ''} ${r.label} sammeln (+${fmt(state['rpc_'+r.key])})`;
    btn.addEventListener('click', ()=>{
      const add = state['rpc_'+r.key] || 0;
      if (add <= 0) return;
      state[r.key] += add;
      updateStatsBar();
      renderUpgrades();
      save();
    });
    elActions.appendChild(btn);
  });
}

function updateActionButtons(){
  RESOURCES.filter(r => state['unl_'+r.key]).forEach(r => {
    const btn = getEl(btnIdFor(r.key));
    if (btn) btn.textContent = `${r.icon ?? ''} ${r.label} sammeln (+${fmt(state['rpc_'+r.key])})`;
  });
}

/* ------------------ Upgrades UI ------------------ */
function buildCard(u, owned, canBuy, resLabel, onBuy){
  const card = document.createElement('div');
  card.className = 'card-sm';

  const h = document.createElement('h3');
  h.textContent = u.name;
  const d = document.createElement('div');
  d.className = 'muted';
  d.textContent = u.desc;

  const priceEl = document.createElement('div');
  priceEl.className = 'muted';
  priceEl.textContent = `Kosten: ${fmt(getPrice(u))} ${resLabel.toUpperCase()}`;

  const ownedEl = document.createElement('div');
  ownedEl.className = 'muted';
  ownedEl.textContent = `Besitz: ${owned}${u.single ? ' (einmalig)' : ''}`;

  const b = document.createElement('button');
  b.className = 'buy ' + (canBuy ? 'can' : 'cannot');
  b.textContent = u.single && owned > 0 ? 'Gekauft' : (canBuy ? 'Kaufen' : 'Nicht genug');
  b.disabled = !canBuy || (u.single && owned > 0);

  b.addEventListener('click', ()=>{ if (!b.disabled) onBuy(); });

  card.append(h, d, priceEl, ownedEl, b);
  return card;
}

function renderUpgrades(){
  if (!elUpgradeGrid) return;
  elUpgradeGrid.innerHTML = '';

  upgrades.filter(canShowUpgrade).forEach(u => {
    const owned = state.owned[u.id] || 0;
    const price = getPrice(u);
    const pool  = state[u.res] || 0;
    const can   = pool >= price && (!u.single || owned === 0);

    const card = buildCard(u, owned, can, u.res, ()=>{
      // bezahlen
      pay(u.res, price);
      // anwenden
      u.apply(state);
      state.owned[u.id] = (state.owned[u.id] || 0) + 1;

      // Ressourcen, Buttons, Stats aktualisieren
      // Falls ein Unlock-Upgrade war, Ressourcen-Leisten/Buttons neu aufbauen
      if (u.id === 'werkbank' || u.id === 'schmiede') {
        renderStatsBar();
        renderActionButtons();
      }
      updateActionButtons();
      updateStatsBar();
      renderUpgrades();
      save();
    });

    elUpgradeGrid.appendChild(card);
  });
}

/* ------------------ Tick Loop ------------------ */
let tickTimer = null;
function startTick(){
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(()=>{
    RESOURCES.forEach(r => {
      const add = state['rps_'+r.key] || 0;
      if (add > 0) state[r.key] += add;
    });
    updateStatsBar();
    renderUpgrades(); // Preise/Buttons neu bewerten
    save();
  }, state.tickMs);
}

/* ------------------ Prestige (Prototyp) ------------------ */
function prestigeAvailable(){
  // einfache Bedingung: Summe aller Ressourcen >= 50,000 (Anpassbar)
  const total = RESOURCES.reduce((a,r)=>a+(state[r.key]||0),0);
  return total >= 50000;
}
function doPrestige(){
  if (!prestigeAvailable()) return;
  // Beispiel: 1 EP je volle 100k Summe
  const total = RESOURCES.reduce((a,r)=>a+(state[r.key]||0),0);
  const gain = Math.floor(total / 100000);
  state.ep = (state.ep || 0) + gain;
  state.prestigeTimes = (state.prestigeTimes || 0) + 1;

  // Reset Ressourcen & Upgrades, aber EP bleibt
  const keep = { ep: state.ep, prestigeTimes: state.prestigeTimes };
  state = JSON.parse(JSON.stringify(DEFAULT));
  state.ep = keep.ep;
  state.prestigeTimes = keep.prestigeTimes;

  // Neu aufbauen
  renderStatsBar();
  renderActionButtons();
  updateStatsBar();
  renderUpgrades();
  updatePrestigeUI();
  save();
}
function updatePrestigeUI(){
  if (elPrestigeReq) elPrestigeReq.textContent = `Erkenntnispunkte (EP): ${fmt(state.ep)}  —  ${(prestigeAvailable()?'Prestige möglich':'Sammle weiter…')}`;
}

/* ------------------ Save / Load ------------------ */
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

/* ------------------ Init ------------------ */
document.addEventListener('DOMContentLoaded', ()=>{
  load();

  // Erstanlage Statsbar/Buttons
  renderStatsBar();
  renderActionButtons();
  updateStatsBar();
  renderUpgrades();
  updatePrestigeUI();
  startTick();

  // Prestige-Button
  if (elPrestigeBtn){
    elPrestigeBtn.addEventListener('click', ()=> doPrestige());
  }
});
