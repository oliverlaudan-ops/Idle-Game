// game.js

import { GameState } from './game-state.js';
import { Resource } from './resource.js';
import upgradesList from './upgrades-def.js';
import { Upgrade } from './upgrade.js';
import prestigeUpgradesList, { PrestigeUpgrade } from './prestige-upgrades.js';


// Main Game Class
class Game {
  constructor() {
    this.resources = {};
    this.upgrades = [];
    this.tickMs = 1000;
    this.tickTimer = null;
    this.statsBarEl = null;
    this.actionsEl = null;
    this.upgradeGridEl = null;
  }

  addResource(res) { this.resources[res.id] = res; }
  getResource(id) { return this.resources[id]; }
  addUpgrade(upg) { this.upgrades.push(upg); }

  setupDOM() {
    this.statsBarEl    = document.getElementById('statsBar');
    this.actionsEl     = document.getElementById('actions');
    this.upgradeGridEl = document.getElementById('upgradeGrid');
  }

  setupGameData() {
    this.addResource(new Resource('stein','Stein','🪨',1,0,true));
    this.addResource(new Resource('holz', 'Holz','🌲',0,0,false));
    this.addResource(new Resource('metall','Metall','⛏️',0,0,false));
    this.addResource(new Resource('kristall', 'Kristall', '💎', 0, 0, false));
    for (const upg of upgradesList) {
      this.addUpgrade(Object.assign(Object.create(Object.getPrototypeOf(upg)), upg));
    }
  }

  recalculateResourceBonuses() {
    // Grundwerte
    this.getResource('stein').rpc = 1;
    this.getResource('holz').rpc = 0;
    this.getResource('metall').rpc = 0;
    this.getResource('kristall').rpc = 0;
    this.getResource('stein').rps = 0;
    this.getResource('holz').rps = 0;
    this.getResource('metall').rps = 0;
    this.getResource('kristall').rps = 0;
    // Upgrades erneut anwenden
    for (let upg of this.upgrades) {
      if (upg.level > 0) {
        for(let i=0; i<upg.level; ++i) {
          if (typeof upg.applyFn === 'function') upg.applyFn(this);
        }
      }
    }
    // Ressourcen-Entsperrungen erneut anwenden
    for (let upg of this.upgrades) {
      if (upg.level > 0 && upg.unlocksResourceId) {
        const res = this.getResource(upg.unlocksResourceId);
        if (res) {
          res.unlocked = true;
          if (res.rpc === 0) res.rpc = 1;
        }
      }
    }
  }

  syncToState() {
    for (let key in this.resources) {
      gameState[key] = this.resources[key].amount;
    }
    gameState.upgrades = this.upgrades.map(u => ({
      id: u.id,
      level: u.level
    }));
  }
  syncFromState() {
    for (let key in this.resources) {
      this.resources[key].amount = gameState[key] ?? 0;
    }
    if (Array.isArray(gameState.upgrades)) {
      for (let u of this.upgrades) {
        let saved = gameState.upgrades.find(su => su.id === u.id);
        u.level = saved ? saved.level : 0;
      }
    }
    this.recalculateResourceBonuses();
  }

  renderStatsBar() {
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

  renderActions() {
    if (!this.actionsEl) return;
    this.actionsEl.innerHTML = '';
    Object.values(this.resources)
      .filter(r => r.unlocked)
      .forEach(r => {
        const btn = document.createElement('button');
        btn.className = `action-btn ${r.id}`;
        btn.id = r.id + 'Btn';
        btn.textContent = `${r.icon} ${r.name} sammeln (+${formatRate(r.rpc)})`;
        btn.onclick = () => {
          r.add(r.rpc * (gameState.prestigeBonus ?? 1));
          this.renderStatsBar();
          this.renderUpgrades();
        };
        this.actionsEl.appendChild(btn);
      });
  }

  renderUpgrades() {
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
      owned.textContent = upg.single
        ? (upg.level > 0 ? 'Einmalig – bereits gekauft' : 'Einmalig')
        : `Stufe: ${upg.level}`;
      const btn = document.createElement('button');
      btn.className = 'buy-btn';
      const canBuy = upg.canBuy(this);
      btn.disabled = !canBuy;
      btn.textContent = upg.single && upg.level > 0
        ? 'Gekauft'
        : (canBuy ? 'Kaufen' : 'Nicht genug');
      btn.onclick = () => {
        if (upg.buy(this)){
          this.recalculateResourceBonuses();
          this.renderAll();
        }
      };
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(costP);
      card.appendChild(owned);
      card.appendChild(btn);
      this.upgradeGridEl.appendChild(card);
    });
  }

  renderPrestigeContainer() {
    const el = document.getElementById('prestigeContainer');
    if (!el) return;
    const canPrestige = gameState.stein >= 1_000_000;
    const toGain = Math.floor(gameState.stein / 1_000_000);
    el.innerHTML = `
      <div class="prestige-info">
        <strong>Prestige-Punkte:</strong> ${gameState.prestige}<br>
        <strong>Bonus:</strong> x${gameState.prestigeBonus.toFixed(2)}
      </div>
      <button id="prestigeBtn" ${canPrestige ? '' : 'disabled'}>
        Prestige durchführen (${toGain} neue Punkte)
      </button>
      <div style="font-size:12px; color:#9aa4b6; margin-top:5px">
        Pro 1 Mio Stein erhältst du 1 Prestige-Punkt.<br>
        Jeder Prestige-Punkt gibt +10% Produktionsbonus.
      </div>
    `;
    document.getElementById('prestigeBtn').onclick = () => {
      this.doPrestige();
    };
  }

  doPrestige() {
    if (gameState.stein < 1_000_000) return;
    const gained = Math.floor(gameState.stein / 1_000_000);
    gameState.prestige += gained;
    gameState.prestigeBonus = 1 + gameState.prestige * 0.1;
    for (const rId in this.resources) {
      this.resources[rId].amount = 0;
      if (rId !== 'stein') this.resources[rId].unlocked = false;
    }
    this.upgrades.forEach(u => u.level = 0);
    gameState.stein = 0;
    gameState.holz = 0;
    gameState.metall = 0;
    gameState.kristall = 0;
    this.recalculateResourceBonuses();
    this.syncToState();
    gameState.save();
    alert(`Du hast ${gained} Prestige-Punkte erhalten!\nBonus jetzt: x${gameState.prestigeBonus.toFixed(2)}`);
    this.renderAll();
  }

  renderAll() {
    this.renderStatsBar();
    this.renderActions();
    this.renderUpgrades();
    this.renderPrestigeContainer();
  }

  startTick() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = setInterval(() => this.tick(), this.tickMs);
  }
  tick() {
    Object.values(this.resources).forEach(r => {
      if (r.unlocked && r.rps > 0){
        r.add(r.rps * (gameState.prestigeBonus ?? 1));
      }
    });
    this.renderStatsBar();
    this.renderUpgrades();
  }
}

// Hilfsfunktionen wie vorher
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

// Init/Bootstrapping
let gameState, game;

document.addEventListener("DOMContentLoaded", () => {
  gameState = new GameState();
  game = new Game();
  game.setupDOM();
  game.setupGameData();
  game.syncFromState();
  game.renderAll();
  game.startTick();
  initButtons();
  window.idleGame = game;
});

function initButtons() {
  setInterval(() => {
    game.syncToState();
    gameState.save();
  }, 5000);

  document.getElementById("resetBtn").addEventListener('click', () => {
    gameState.reset();
    game.syncFromState();
    game.renderAll();
  });

  document.getElementById("exportBtn").addEventListener('click', () => {
    game.syncToState();
    const exportedData = gameState.export();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(exportedData);
    } else {
      prompt('Daten zum Kopieren:', exportedData);
    }
  });

  document.getElementById("importBtn").addEventListener('click', () => {
    const importedData = prompt('Füge den Export-String ein:');
    if (importedData) {
      gameState.import(importedData);
      game.syncFromState();
      game.renderAll();
    }
  });
}
