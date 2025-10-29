// ---------- Spielzustand ----------
const state = {
  stein: 0,
  holz: 0,
  metall: 0,            // NEU

  rpcStein: 1,
  rpcHolz: 0,
  rpcMetall: 0,         // NEU

  rpsStein: 0,
  rpsHolz: 0,
  rpsMetall: 0,         // NEU

  totalEarned: 0,

  unlocks: { holz: false, metall: false }, // NEU: metall
  owned: {},
  
  // (falls noch nicht vorhanden; für Tooltips)
  totalStein: 0,
  totalHolz: 0,
  totalMetall: 0,       // NEU
};

// Tick-Konstante
const TICK_MS = 1000;

// zusätzliche Totals (für Tooltips)
state.totalStein = state.totalStein || 0;
state.totalHolz  = state.totalHolz  || 0;

// vorherige Werte für Pulsevergleich
let prev = { stein: 0, holz: 0 };

// Helper-Funktion
function isResourceUnlocked(res){
  if (res === 'stein')  return true;
  if (res === 'holz')   return !!state.unlocks.holz;
  if (res === 'metall') return !!state.unlocks.metall;
  return true;
}
// Unlock-Upgrades (mit unlockerFor) sollen sichtbar sein,
// sobald ihre Voraussetzung (requiresUnlock) erfüllt ist.
function shouldShow(upg){
  const visibleByRes     = isResourceUnlocked(upg.res);
  const isUnlocker       = !!upg.unlockerFor;
  const unlockReqOk      = !upg.requiresUnlock || !!state.unlocks[upg.requiresUnlock];

  // normale Upgrades: Ressource muss freigeschaltet sein
  // Unlock-Upgrades: Voraussetzung erfüllt? => zeigen, auch wenn Ziel-Ressource noch zu ist
  if (isUnlocker) return unlockReqOk;
  return visibleByRes && unlockReqOk;
}

// ---------- Upgrades ----------
const upgrades = [
  // STEIN
  { id:'faustkeil',  group:'stein', res:'stein', name:'Faustkeil',  desc:'+1 Stein/Klick',  baseCost:10,  mult:1.15,
    apply:s=>{ s.rpcStein += 1; } },

  { id:'steinspalter', group:'stein', res:'stein', name:'Steinspalter', desc:'+0.2 Stein/Sek', baseCost:30, mult:1.16,
    apply:s=>{ s.rpsStein += 0.2; } },

  { id:'arbeiter', group:'stein', res:'stein', name:'Arbeiter', desc:'+1 Stein/Sek', baseCost:120, mult:1.18,
    apply:s=>{ s.rpsStein += 1; } },

  { id:'steinmine', group:'stein', res:'stein', name:'Steinmine', desc:'+8 Stein/Sek', baseCost:520, mult:1.22,
    apply:s=>{ s.rpsStein += 8; } },

  // SCHALTET HOLZ FREI
  { id:'werkbank', group:'stein', res:'stein', name:'Werkbank', desc:'Schaltet HOLZ frei', baseCost:250, mult:2.5, single:true,
    apply:s=>{ s.unlocks.holz = true; if (s.rpcHolz <= 0) s.rpcHolz = 1; } },

  // HOLZ (sichtbar erst nach Werkbank)
  { id:'axt', group:'holz', res:'holz', requiresUnlock:'holz', name:'Axt', desc:'+1 Holz/Klick', baseCost:120, mult:1.18,
    apply:s=>{ s.rpcHolz += 1; } },

  { id:'holzfaeller', group:'holz', res:'holz', requiresUnlock:'holz', name:'Holzfäller', desc:'+0.8 Holz/Sek', baseCost:240, mult:1.2,
    apply:s=>{ s.rpsHolz += 0.8; } },

  { id:'saegewerk', group:'holz', res:'holz', requiresUnlock:'holz', name:'Sägewerk', desc:'+6 Holz/Sek', baseCost:520, mult:1.22,
    apply:s=>{ s.rpsHolz += 6; } },

    // --- Metall-Chain ---
  // Unlock über Holz-Kosten:
  { id:'schmiede', group:'metall', res:'holz', requiresUnlock:'holz',
    name:'Schmiede', desc:'Schaltet METALL frei', baseCost:4400, mult:1.35, single:true,
    apply:s=>{ s.unlocks.metall = true; if (s.rpcMetall <= 0) s.rpcMetall = 1; }
  },

  { id:'eisernePicke', group:'metall', res:'metall', requiresUnlock:'metall',
    name:'Eiserne Picke', desc:'+1 Metall/Klick', baseCost:1000, mult:1.22,
    apply:s=>{ s.rpcMetall += 1; }
  },

  { id:'bergwerk', group:'metall', res:'metall', requiresUnlock:'metall',
    name:'Bergwerk', desc:'+1.5 Metall/Sek', baseCost:2500, mult:1.24,
    apply:s=>{ s.rpsMetall += 1.5; }
  },

  { id:'giesserei', group:'metall', res:'metall', requiresUnlock:'metall',
    name:'Gießerei', desc:'+10 Metall/Sek', baseCost:12000, mult:1.28,
    apply:s=>{ s.rpsMetall += 10; }
  },
];

// ---------- DOM ----------
const clickSteinBtn = document.getElementById('steinBtn');
const clickHolzBtn  = document.getElementById('holzBtn');
const clickMetallBtn= document.getElementById('metallBtn'); // NEU
const prestigeBtn   = document.getElementById('prestigeBtn');

// ---------- Render: Stats ----------
const renderStats = () => {
  // große Stats unten
  document.getElementById('steinStats').textContent = `Stein: ${fmt(state.stein)}  (+${fmt(state.rpsStein)}/s)`;
  document.getElementById('holzStats').textContent  = `Holz: ${fmt(state.holz)}  (+${fmt(state.rpsHolz)}/s)`;
  document.getElementById('metallStats').textContent  = `Metall: ${fmt(state.metall)}  (+${fmt(state.rpsMetall)}/s)`;

  // Statsbar oben
  // Statsbar oben
const setText = (id, val) => {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
};

// Stein & Holz
setText('sbStein', fmt(state.stein));
setText('sbHolz', fmt(state.holz));
setText('sbSteinRate', `+${fmt(state.rpsStein)}/s`);
setText('sbHolzRate', `+${fmt(state.rpsHolz)}/s`);
setText('sbSteinClick', `+${fmt(state.rpcStein)}/click`);
setText('sbHolzClick', `+${fmt(state.rpcHolz)}/click`);

// Metall (NEU)
setText('sbMetall', fmt(state.metall));
setText('sbMetallRate', `+${fmt(state.rpsMetall)}/s`);
setText('sbMetallClick', `+${fmt(state.rpcMetall)}/click`);

// Sichtbarkeit Metall-Block + Pulse
const mItem = document.getElementById('sbMetallItem');
if (state.unlocks.metall || state.rpcMetall > 0 || state.rpsMetall > 0) {
  if (mItem) mItem.style.display = '';
  if (state.metall > (prev.metall ?? 0)) {
    mItem?.classList.add('metall');
    pulse(mItem);
  }
}
prev.metall = state.metall;


  // Hover-Tooltips: pro Klick / Sek / total (bereits vorhanden – hier nochmal der Call)
  updateTooltips();
  updateMeta();
};



// ---------- Buttons dynamisch ----------
const updateClickButtons = () => {
  clickSteinBtn.textContent = `🪨 Stein sammeln (+${fmt(state.rpcStein)})`;

  if (state.unlocks.holz || state.rpcHolz > 0) {
    clickHolzBtn.style.display = '';
    clickHolzBtn.textContent = `🌲 Holz hacken (+${fmt(state.rpcHolz)})`;
  } else {
    clickHolzBtn.style.display = 'none';
  }

  if (state.unlocks.metall || state.rpcMetall > 0) {
    clickMetallBtn.style.display = '';
    clickMetallBtn.textContent = `⛏️ Metall abbauen (+${fmt(state.rpcMetall)})`;
  } else {
    clickMetallBtn.style.display = 'none';
  }
};


// ---------- Upgrade-Grid ----------
const list = upgrades.filter(shouldShow);
list.forEach(upg => {
  const owned = state.owned[upg.id] || 0;
  const price = Math.floor(upg.baseCost * Math.pow(upg.mult || 1, owned));
  const pool  = upg.res === 'stein' ? state.stein
              : upg.res === 'holz'  ? state.holz
              : upg.res === 'metall'? state.metall
              : 0;

  const canBuy = pool >= price && (!upg.single || owned === 0);
  const btnText = upg.single && owned > 0 ? 'Gekauft' : (canBuy ? 'Kaufen' : 'Nicht genug');

  const card = buildCard(
    upg,
    owned,
    canBuy,
    upg.res.toUpperCase(),
    () => {
      if (!canBuy) return;
      // bezahlen
      if (upg.res === 'stein')  state.stein  -= price;
      if (upg.res === 'holz')   state.holz   -= price;
      if (upg.res === 'metall') state.metall -= price;

      // anwenden
      upg.apply(state);
      state.owned[upg.id] = (state.owned[upg.id] || 0) + 1;

      // UI aktualisieren (Buttons/Stats)
      updateClickButtons();
      renderAll();
    }
  );

  // Karte an Grid anhängen
  upgradeGrid.appendChild(card);
});


// Kostenfortschritt je Upgrade
function getCurrentCost(upg){
  const owned = state.owned[upg.id] || 0;
  return upg.baseCost * Math.pow(upg.mult, owned);
}

// Kaufvorgang
function buy(upg, shownCost){
  // Guard
  if (upg.single && (state.owned[upg.id]||0) >= 1) return;
  if (state[upg.res] < shownCost) return;

  // Bezahlen
  state[upg.res] -= shownCost;

  // Effekt
  upg.apply(state);

  // Besitz zählen
  state.owned[upg.id] = (state.owned[upg.id] || 0) + 1;

  // UI
  renderAll();
}

// ---------- Kartenbau ----------
function buildCard(upg, owned, canBuy, resLabel, shownCost, onBuy){
  const card = document.createElement('div');
  card.className = 'card-sm';

  const h3 = document.createElement('h3');
  h3.textContent = upg.name;
  card.appendChild(h3);

  const d1 = document.createElement('div');
  d1.className = 'muted';
  d1.textContent = upg.desc;
  card.appendChild(d1);

  const d2 = document.createElement('div');
  d2.className = 'muted';
  d2.textContent = `Kosten: ${fmt(shownCost)} ${resLabel}`;
  card.appendChild(d2);

  if (upg.single){
    const d3 = document.createElement('div');
    d3.className = 'muted';
    d3.textContent = `Besitz: ${owned ? '1 (einmalig)' : '0'}`;
    card.appendChild(d3);
  } else {
    const d3 = document.createElement('div');
    d3.className = 'muted';
    d3.textContent = `Besitz: ${owned}`;
    card.appendChild(d3);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  if (upg.single && owned >= 1){
    btn.textContent = 'Gekauft';
    btn.disabled = true;
    btn.className = 'buy cannot';
  } else {
    btn.textContent = canBuy ? 'Kaufen' : 'Nicht genug';
    btn.disabled = !canBuy;
    btn.className = 'buy ' + (canBuy ? 'can' : 'cannot');
    btn.onclick = onBuy;
  }
  card.appendChild(btn);

  return card;
}

const pulse = (el, cls='pulse') => {
  if(!el) return;
  el.classList.remove(cls);
  // reflow trick, damit Animation erneut startet
  void el.offsetWidth;
  el.classList.add(cls);
};

const updateTooltips = () => {
  const steinTip = `pro Klick: +${fmt(state.rpcStein)}\npro Sekunde: +${fmt(state.rpsStein)}\ngesamt produziert: ${fmt(state.totalStein)}`;
  const holzTip  = `pro Klick: +${fmt(state.rpcHolz)}\npro Sekunde: +${fmt(state.rpsHolz)}\ngesamt produziert: ${fmt(state.totalHolz)}`;
  const sItem = document.getElementById('sbSteinItem');
  const hItem = document.getElementById('sbHolzItem');
  if (sItem) sItem.title = steinTip;
  if (hItem) hItem.title  = holzTip;
};

const updateMeta = () => {
  const tick = document.getElementById('sbTick');
  if (tick) tick.textContent = `Tick ${(TICK_MS/1000).toFixed(1)}s`;
};

// Autosave-Feedback (du kannst hier deinen echten Save-Hook triggern)
const showAutosave = () => {
  const el = document.getElementById('sbSave');
  if (!el) return;
  pulse(el,'flash');
};


// ---------- Render-All ----------
const renderAll = () => {
  renderStats();
  renderUpgrades();
  updateClickButtons();
};

// ---------- Format ----------
function fmt(n){
  // einfache kompakte Formatierung
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(2)+'K';
  return (Math.round(n*100)/100).toString();
}

// ---------- Click Events ----------
clickSteinBtn.addEventListener('click', () => {
  state.stein += state.rpcStein;
  state.totalEarned += state.rpcStein;
  state.totalStein  += state.rpcStein;   // NEU
  renderAll();
});

clickHolzBtn.addEventListener('click', () => {
  if (!state.unlocks.holz && state.rpcHolz<=0) return;
  state.holz += state.rpcHolz;
  state.totalEarned += state.rpcHolz;
  state.totalHolz  += state.rpcHolz;     // NEU
  renderAll();
});

clickMetallBtn.addEventListener('click', () => {
  if (!state.unlocks.metall && state.rpcMetall<=0) return;
  state.metall += state.rpcMetall;
  state.totalEarned += state.rpcMetall;
  state.totalMetall += state.rpcMetall;
  renderAll();
});

prestigeBtn.addEventListener('click', () => {
  if (state.stein >= 50000) {
    alert('Prestige ausgelöst!');
    // Hard-Reset (einfach gehalten)
    const keep = { }; // hier später EP-Mechanik einbauen
    Object.assign(state, {
      stein:0, holz:0, rpcStein:1, rpcHolz:0, rpsStein:0, rpsHolz:0,
      totalEarned:0, unlocks:{holz:false}, owned:{}
    }, keep);
    renderAll();
  }
});

// ---------- Passive Produktion (Tick) ----------
setInterval(() => {
  if (state.rpsStein   > 0) { state.stein   += state.rpsStein;   state.totalStein   += state.rpsStein; }
  if (state.rpsHolz    > 0) { state.holz    += state.rpsHolz;    state.totalHolz    += state.rpsHolz;  }
  if (state.rpsMetall  > 0) { state.metall  += state.rpsMetall;  state.totalMetall  += state.rpsMetall; }
  renderAll();
}, TICK_MS);

// optional: Autosave-Feedback alle 30s
setInterval(() => { showAutosave(); /* save() wäre hier ideal */ }, 30000);


// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', renderAll);
renderAll();
