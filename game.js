/* ==========================================================
   From Stone to Civilization – OOP Version (plain JS)
   ========================================================== */
// Globale Objekte, damit alle Funktionen Zugriff haben
let game;
let gameState;

/* ---------- Hilfsfunktionen ---------- */
function formatAmount(n){
  if (n >= 1_000_000) return (n/1_000_000).toFixed(2)+'M';
  if (n >= 1_000)     return (n/1_000).toFixed(2)+'K';
  return n.toFixed(0);
}
function formatRate(n){
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs < 1) return n.toFixed(2);
  if (abs < 1000) return n.toFixed(1);
  return formatAmount(n);
}

/* ---------- Klasse: GameState ---------- */
class GameState {
  constructor() {
    // Robust: Prüfen, ob ein State im LocalStorage definiert und gültig ist
    let storageValue = localStorage.getItem("gameState");
    let savedState = null;
    if (storageValue && storageValue !== "undefined") {
      try {
        savedState = JSON.parse(storageValue);
        Object.assign(this, savedState);
      } catch (e) {
        // Fehlerhafte oder alte Spielstände ignorieren
      }
    }
    if (!savedState) {
      // Initialwerte
      this.stein = 0;
      this.holz = 0;
      this.metall = 0;
      this.kristall = 0;
      this.rpcStein = 1;
      this.rpcHolz = 0;
      this.rpcMetall = 0;
      this.rpcKristall = 0;
      this.totalEarned = 0;
      this.upgrades = [];
      this.save();
    }
  }

  // Speichern
  save() {
    localStorage.setItem('gameState', JSON.stringify(this));
  }

  // Reset
  reset() {
    if (confirm('Wirklich alles zurücksetzen?')) {
      localStorage.removeItem('gameState');
      this.stein = 0;
      this.holz = 0;
      this.metall = 0;
      this.kristall = 0;
      this.rpcStein = 1;
      this.rpcHolz = 0;
      this.rpcMetall = 0;
      this.rpcKristall = 0;
      this.totalEarned = 0;
      this.upgrades = [];
      this.save();
      alert('Zurückgesetzt!');
    }
  }

  // Export als Base64
  export() {
    const savedState = JSON.stringify(this);
    const encoded = btoa(savedState);
    alert('Exportiert: ' + encoded);
    return encoded;
  }

  // Import von Base64
  import(encodedState) {
    try {
      const decoded = atob(encodedState);
      const parsedState = JSON.parse(decoded);
      Object.assign(this, parsedState);
      this.save();
      alert('Import erfolgreich!');
    } catch (e) {
      alert('Fehler beim Importieren: ' + e.message);
    }
  }
}

/* ---------- Klasse: Resource ---------- */
class Resource {
  constructor(id, name, icon, rpc = 1, rps = 0, unlocked = true){
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.amount = 0;
    this.rpc = rpc;
    this.rps = rps;
    this.unlocked = unlocked;
  }
  add(n){ this.amount += n; }
  spend(n){
    if (this.amount >= n){
      this.amount -= n;
      return true;
    }
    return false;
  }
}

/* ---------- Klasse: Upgrade ---------- */
class Upgrade {
  constructor(opts){
    this.id   = opts.id;
    this.name = opts.name;
    this.desc = opts.desc;
    this.costRes  = opts.costRes;
    this.costBase = opts.costBase;
    this.costMult = opts.costMult ?? 1.15;
    this.applyFn  = opts.apply;
    this.single   = !!opts.single;
    this.unlocksResourceId = opts.unlocksResourceId || null;
    this.level = 0;
  }
  getCurrentCost(){
    return Math.floor(this.costBase * Math.pow(this.costMult, this.level || 0));
  }
  canBuy(game){
    const res = game.getResource(this.costRes);
    if (!res || !res.unlocked) return false;
    if (this.single && this.level > 0) return false;
    return res.amount >= this.getCurrentCost();
  }
  buy(game){
    if (!this.canBuy(game)) return false;
    const res   = game.getResource(this.costRes);
    const cost  = this.getCurrentCost();
    if (!res.spend(cost)) return false;
    this.level++;
    if (typeof this.applyFn === 'function'){ this.applyFn(game); }
    if (this.unlocksResourceId){
      const r2 = game.getResource(this.unlocksResourceId);
      if (r2){
        r2.unlocked = true;
        if (r2.rpc === 0) r2.rpc = 1;
      }
    }
    return true;
  }
}

/* ---------- Klasse: Game ---------- */
class Game {
  constructor(){
    this.resources = {};
    this.upgrades  = [];
    this.tickMs    = 1000;
    this.tickTimer = null;
    this.statsBarEl    = null;
    this.actionsEl     = null;
    this.upgradeGridEl = null;
  }

syncToState() {
    for (const key in this.resources) {
      gameState[key] = this.resources[key].amount;
    }
    gameState.upgrades = this.upgrades.map(u => ({ id: u.id, level: u.level }));
  }

  // Übertrage gespeicherte Werte von gameState zurück in game
  syncFromState() {
    for (const key in this.resources) {
      this.resources[key].amount = gameState[key] ?? 0;
    }
    if (Array.isArray(gameState.upgrades)) {
      for (const upg of this.upgrades) {
        const saved = gameState.upgrades.find(s => s.id === upg.id);
        upg.level = saved ? saved.level : 0;
      }
    }
  }
   
  addResource(res){ this.resources[res.id] = res; }
  getResource(id){ return this.resources[id]; }
  addUpgrade(upg){ this.upgrades.push(upg); }
  setupDOM(){
    this.statsBarEl    = document.getElementById('statsBar');
    this.actionsEl     = document.getElementById('actions');
    this.upgradeGridEl = document.getElementById('upgradeGrid');
  }
  setupGameData(){
    this.addResource(new Resource('stein','Stein','🪨',1,0,true));
    this.addResource(new Resource('holz', 'Holz','🌲',0,0,false));
    this.addResource(new Resource('metall','Metall','⛏️',0,0,false));
    this.addResource(new Resource('kristall', 'Kristall', '💎', 0, 0, false));     
    // Upgrades:
    // --- Stein-Upgrade-Kette ---
    this.addUpgrade(new Upgrade({
      id:'faustkeil',
      name:'Faustkeil',
      desc:'+1 Stein pro Klick',
      costRes:'stein',
      costBase:10,
      costMult:1.25,
      apply:(game)=>{
        game.getResource('stein').rpc += 1;
      }
    }));

    this.addUpgrade(new Upgrade({
      id:'steinspalter',
      name:'Steinspalter',
      desc:'+0.2 Stein / Sekunde',
      costRes:'stein',
      costBase:30,
      costMult:1.30,
      apply:(game)=>{
        game.getResource('stein').rps += 0.2;
      }
    }));

    this.addUpgrade(new Upgrade({
      id:'steinmine',
      name:'Steinmine',
      desc:'+5 Stein / Sekunde',
      costRes:'stein',
      costBase:120,
      costMult:1.35,
      apply:(game)=>{
        game.getResource('stein').rps += 5;
      }
    }));

     this.addUpgrade(new Upgrade({
      id:'bergwerk',
      name:'Bergwerk',
      desc:'+20 Stein / Sekunde',
      costRes:'stein',
      costBase:1000,
      costMult:1.5,
      apply:(game)=>{
        game.getResource('stein').rps += 20;
      }
    }));

    // --- Globaler Multiplikator ---
this.addUpgrade(new Upgrade({
  id: 'globaler-multiplikator',
  name: 'Effizienzverbesserung',
  desc: 'Erhöht alle Produktionsraten um 1.5x',
  costRes: 'stein',
  costBase: 10000,
  costMult: 1.5,
  single: true,
  apply: (game) => {
    game.getResource('stein').rpc *= 1.5;
    game.getResource('holz').rpc *= 1.5;
    game.getResource('metall').rpc *= 1.5;
    game.getResource('kristall').rpc *= 1.5;
    game.getResource('stein').rps *= 1.5;
    game.getResource('holz').rps *= 1.5;
    game.getResource('metall').rps *= 1.5;
    game.getResource('kristall').rps *= 1.5;
  }
}));
 

    // --- Holz freischalten & verbessern ---
    this.addUpgrade(new Upgrade({
      id:'werkbank',
      name:'Werkbank',
      desc:'Schaltet HOLZ frei',
      costRes:'stein',
      costBase:80,
      costMult:2.0,
      single:true,
      unlocksResourceId:'holz',
      apply:(game)=>{
        const holz = game.getResource('holz');
        holz.rpc = Math.max(holz.rpc,1);
      }
    }));

    this.addUpgrade(new Upgrade({
      id:'axt',
      name:'Axt',
      desc:'+1 Holz pro Klick',
      costRes:'holz',
      costBase:50,
      costMult:1.30,
      apply:(game)=>{
        game.getResource('holz').rpc += 1;
      }
    }));

    this.addUpgrade(new Upgrade({
      id:'holzfaeller',
      name:'Holzfäller',
      desc:'+0.8 Holz / Sekunde',
      costRes:'holz',
      costBase:120,
      costMult:1.30,
      apply:(game)=>{
        game.getResource('holz').rps += 0.8;
      }
    }));

     this.addUpgrade(new Upgrade({
      id:'saegewerk',
      name:'Sägewerk',
      desc:'+5 Holz / Sekunde',
      costRes:'holz',
      costBase:500,
      costMult:1.4,
      apply:(game)=>{
        game.getResource('holz').rps += 5;
      }
    }));

    // --- Metall freischalten & verbessern ---
    this.addUpgrade(new Upgrade({
      id:'schmiede',
      name:'Schmiede',
      desc:'Schaltet METALL frei',
      costRes:'holz',
      costBase:420,
      costMult:2.1,
      single:true,
      unlocksResourceId:'metall',
      apply:(game)=>{
        const m = game.getResource('metall');
        m.rpc = Math.max(m.rpc,1);
      }
    }));

    this.addUpgrade(new Upgrade({
      id:'eisernePicke',
      name:'Eiserne Picke',
      desc:'+1 Metall pro Klick',
      costRes:'metall',
      costBase:200,
      costMult:1.30,
      apply:(game)=>{
        game.getResource('metall').rpc += 1;
      }
    }));

    this.addUpgrade(new Upgrade({
      id:'schmelzofen',
      name:'Schmelzofen',
      desc:'+1.5 Metall / Sekunde',
      costRes:'metall',
      costBase:600,
      costMult:1.35,
      apply:(game)=>{
        game.getResource('metall').rps += 1.5;
      }
    }));
  

   this.addUpgrade(new Upgrade({
      id:'giesserei',
      name:'Gießerei',
      desc:'+5 Metall / Sekunde',
      costRes:'metall',
      costBase:1500,
      costMult:1.5,
      apply:(game)=>{
        game.getResource('metall').rps += 5;
      }
    }));
  

  /* ---- Kristall ---- */
 this.addUpgrade(new Upgrade({
      id:'kristallberg',
      name:'Kristall-Bergwerk',
      desc:'Schaltet KRISTALL frei',
      costRes:'metall',
      costBase:920,
      costMult:2.1,
      single:true,
      unlocksResourceId:'kristall',
      apply:(game)=>{
        const m = game.getResource('kristall');
        m.rpc = Math.max(m.rpc,1);
      }
    }));

this.addUpgrade(new Upgrade({
      id:'kristallmine',
      name:'Kristall-Mine',
      desc:'+1 Kristall pro Klick',
      costRes:'kristall',
      costBase:500,
      costMult:1.45,
      apply:(game)=>{
        game.getResource('kristall').rpc += 1;
      }
    }));
  

this.addUpgrade(new Upgrade({
      id:'kristallarbeiter',
      name:'Kristall-Arbeiter',
      desc:'+0.15 Kristall / Sekunde',
      costRes:'kristall',
      costBase:1500,
      costMult:1.5,
      apply:(game)=>{
        game.getResource('kristall').rps += 0.15;
      }
    }));
  

this.addUpgrade(new Upgrade({
      id:'kristallbagger',
      name:'Kristall-Bagger',
      desc:'+15 Kristall / Sekunde',
      costRes:'kristall',
      costBase:4500,
      costMult:2,
      apply:(game)=>{
        game.getResource('kristall').rps += 15;
      }
    }));
  }

/* ---- Rendering ---- */   
  renderStatsBar(){
    if (!this.statsBarEl) return;
    this.statsBarEl.innerHTML = '';
    const resList = Object.values(this.resources).filter(r => r.unlocked);
    resList.forEach(r => {
      const pill = document.createElement('div');
      pill.className = 'stat-pill';
      pill.id = 'stat-'+r.id;
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = `${r.icon} ${r.name}: ${formatAmount(r.amount)}`;
      const details = document.createElement('span');
      details.className = 'details';
      details.textContent = `+${formatRate(r.rps)}/s, +${formatRate(r.rpc)}/Klick`;
      pill.appendChild(label);
      pill.appendChild(details);
      this.statsBarEl.appendChild(pill);
    });
    const meta = document.createElement('div');
    meta.className = 'stat-meta';
    meta.textContent = `Tick: ${(this.tickMs/1000).toFixed(1)}s`;
    this.statsBarEl.appendChild(meta);
  }
  renderActions(){
    if (!this.actionsEl) return;
    this.actionsEl.innerHTML = '';
    Object.values(this.resources)
      .filter(r => r.unlocked)
      .forEach(r => {
        const btn = document.createElement('button');
        btn.className = `action-btn ${r.id}`;
        btn.id = r.id + 'Btn';
        btn.textContent = `${r.icon} ${r.name} sammeln (+${formatRate(r.rpc)})`;
        btn.addEventListener('click', () => {
          r.add(r.rpc);
          this.renderStatsBar();
          this.renderUpgrades();
        });
        this.actionsEl.appendChild(btn);
      });
  }
  renderUpgrades(){
    if (!this.upgradeGridEl) return;
    this.upgradeGridEl.innerHTML = '';
    this.upgrades.forEach(upg => {
      const costRes = this.getResource(upg.costRes);
      if (!costRes || !costRes.unlocked) return;
      const card = document.createElement('div');
      card.className = 'card';
      const title = document.createElement('h3');
      title.textContent = upg.name;
      const desc = document.createElement('p');
      desc.textContent = upg.desc;
      const costP = document.createElement('p');
      const cost = upg.getCurrentCost();
      costP.textContent = `Kosten: ${formatAmount(cost)} ${costRes.name}`;
      const owned = document.createElement('p');
      owned.className = 'muted';
      if (upg.single){
        owned.textContent = upg.level > 0 ? 'Einmalig – bereits gekauft' : 'Einmalig';
      } else {
        owned.textContent = `Stufe: ${upg.level}`;
      }
      const btn = document.createElement('button');
      btn.className = 'buy-btn';
      const canBuy = upg.canBuy(this);
      btn.disabled = !canBuy;
      btn.textContent = upg.single && upg.level > 0
        ? 'Gekauft'
        : (canBuy ? 'Kaufen' : 'Nicht genug');
      btn.addEventListener('click', () => {
        if (upg.buy(this)){
          this.renderAll();
        }
      });
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(costP);
      card.appendChild(owned);
      card.appendChild(btn);
      this.upgradeGridEl.appendChild(card);
    });
  }
  renderAll(){
    this.renderStatsBar();
    this.renderActions();
    this.renderUpgrades();
  }
  startTick(){
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = setInterval(() => this.tick(), this.tickMs);
  }
  tick(){
    Object.values(this.resources).forEach(r => {
      if (r.unlocked && r.rps > 0){
        r.add(r.rps);
      }
    });
    this.renderStatsBar();
    this.renderUpgrades();
  }
}

/* ---------- Bootstrap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  gameState = new GameState(); // Erstellt und lädt ggf. Spielstand
  game = new Game();
  game.setupDOM();
  game.setupGameData();
  game.renderAll();
  game.startTick();
  initButtons(); // Jetzt existieren game und gameState
  window.idleGame = game;
});

function initButtons() {
  // Autosave
  setInterval(() => {
    game.syncToState();
    gameState.save();
  }, 5000);

  // Reset Button
  document.getElementById("resetBtn").addEventListener('click', () => {
    game.syncToState();
    gameState.save(); 
    gameState.reset();
    game.syncFromState();
    game.renderAll();
  });

  // Export Button
  document.getElementById("exportBtn").addEventListener('click', () => {
    const exportedData = gameState.export();
    game.syncToState();
    gameState.save(); 
    if (navigator.clipboard) {
      navigator.clipboard.writeText(exportedData);
    } else {
      prompt('Daten zum Kopieren:', exportedData);
    }
  });

  // Import Button
  document.getElementById("importBtn").addEventListener('click', () => {
    const importedData = prompt('Füge den Export-String ein:');
    if (importedData) {
      gameState.import(importedData);
      game.syncFromState();
      game.renderAll();
    }
  });
}
