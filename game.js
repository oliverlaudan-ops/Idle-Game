// ---------- Spielzustand ----------
const state = {
  stein: 0,
  holz: 0,

  rpcStein: 1,   // Stein pro Klick
  rpcHolz: 0,    // Holz pro Klick (0 bis Werkbank)

  rpsStein: 0,   // Stein pro Sekunde
  rpsHolz: 0,    // Holz pro Sekunde

  totalEarned: 0,

  unlocks: { holz: false },   // wird durch Werkbank freigeschaltet
  owned: {},                  // Stückzahlen je Upgrade-ID
};

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
];

// ---------- DOM ----------
const clickSteinBtn = document.getElementById('steinBtn');
const clickHolzBtn  = document.getElementById('holzBtn');
const prestigeBtn   = document.getElementById('prestigeBtn');

// ---------- Render: Stats ----------
const renderStats = () => {
  // bestehende große Stats
  document.getElementById('steinStats').textContent = `Stein: ${fmt(state.stein)}  (+${fmt(state.rpsStein)}/s)`;
  document.getElementById('holzStats').textContent  = `Holz: ${fmt(state.holz)}  (+${fmt(state.rpsHolz)}/s)`;

  // NEU: kompakte Statsbar oben
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('sbStein', fmt(state.stein));
  set('sbHolz',  fmt(state.holz));
  set('sbSteinRate', `+${fmt(state.rpsStein)}/s`);
  set('sbHolzRate',  `+${fmt(state.rpsHolz)}/s`);
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
};

// ---------- Upgrade-Grid ----------
const renderUpgrades = () => {
  const upgradeGrid = document.getElementById('upgrade-grid');
  upgradeGrid.innerHTML = '';

  upgrades.forEach(upg => {
    // Sichtbarkeit (z.B. Holz erst nach Werkbank)
    if (upg.requiresUnlock && !state.unlocks[upg.requiresUnlock]) return;

    const costShown = Math.floor(getCurrentCost(upg));
    const canBuy = (state[upg.res] >= costShown) && !(upg.single && (state.owned[upg.id]||0) >= 1);
    const card = buildCard(
      upg,
      state.owned[upg.id] || 0,
      canBuy,
      (upg.res === 'stein' ? 'Stein' : 'Holz'),
      costShown,
      () => buy(upg, costShown)
    );
    upgradeGrid.appendChild(card);
  });
};

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
  renderAll();
});

clickHolzBtn.addEventListener('click', () => {
  if (!state.unlocks.holz && state.rpcHolz<=0) return;
  state.holz += state.rpcHolz;
  state.totalEarned += state.rpcHolz;
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
  if (state.rpsStein > 0) state.stein += state.rpsStein;
  if (state.rpsHolz  > 0) state.holz  += state.rpsHolz;
  // nur Stats aktualisieren reicht; Upgrades nur neu, wenn Kaufbarkeit kippt – ist ok,
  // aber für „weich“ -> full render:
  renderAll();
}, 1000);

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', renderAll);
renderAll();
