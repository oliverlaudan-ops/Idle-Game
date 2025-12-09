import { GameState } from './game-state.js';
import resourcesList from './resources-def.js';
import upgradesList from './upgrades-def.js';
import researchUpgradesList from "./research-def.js"; // NEU
import prestigeUpgradesList, { PrestigeUpgrade } from './prestige-upgrades.js';
// Prestige-Import NEU:
import { calculatePrestigePoints, doPrestige, getEffectivePrestigeBonus } from './prestige.js';

// Hilfsfunktionen
function formatAmount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(0);
}
function formatRate(n) {
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs < 1) return n.toFixed(2);
  if (abs < 1000) return n.toFixed(1);
  return formatAmount(n);
}

function updateActionsStickyTop() {
  const statsBar = document.querySelector('.stats-bar');
  const actions = document.querySelector('.actions');
  if (statsBar && actions) {
    const barHeight = statsBar.offsetHeight;
    actions.style.top = (barHeight + 12) + 'px'; // 12px als Abstand
  }
}

class Game {
  constructor() {
    this.resources = {};
    this.upgrades = [];
    this.prestigeUpgrades = [];
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
    this.statsBarEl = document.getElementById('statsBar');
    this.actionsEl = document.getElementById('actions');
    this.upgradeGridEl = document.getElementById('upgradeGrid');
    this.researchGridEl = document.getElementById("researchGrid"); // NEU
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        btn.classList.add("buy-btn");
        document.querySelectorAll(".upgrade-grid").forEach(grid => {
        if (grid.dataset.tab === target) {
          grid.style.display = "flex";   // wichtig: Flex für Spalten-Layout
        } else {
          grid.style.display = "none";
        }
        });
      });
    });
  }

  setupGameData() {
    for (const res of resourcesList) {
      this.addResource(Object.assign(Object.create(Object.getPrototypeOf(res)), res));
    }
    for (const upg of upgradesList) {
      this.addUpgrade(Object.assign(Object.create(Object.getPrototypeOf(upg)), upg));
    }
    for (const upg of researchUpgradesList) {          // NEU
    this.addUpgrade(Object.assign(Object.create(Object.getPrototypeOf(upg)), upg));
    }
    this.prestigeUpgrades = prestigeUpgradesList.map(
      upg => Object.assign(new PrestigeUpgrade({}), upg)
    );
  }

  recalculateResourceBonuses() {
    for (const key in this.resources) {
      this.resources[key].rpc = (key === 'stein') ? 1 : 0;
      this.resources[key].rps = 0;
    }
    for (let upg of this.upgrades) {
      if (upg.level > 0) {
        for (let i = 0; i < upg.level; ++i) {
          if (typeof upg.applyFn === 'function') upg.applyFn(this);
        }
      }
    }
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
    gameState.prestigeUpgrades = this.prestigeUpgrades.map(u => ({
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
    if (Array.isArray(gameState.prestigeUpgrades)) {
      for (let u of this.prestigeUpgrades) {
        let saved = gameState.prestigeUpgrades.find(su => su.id === u.id);
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
      pill.id = 'stat-' + r.id;
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
    meta.textContent = `Tick: ${(this.tickMs / 1000).toFixed(1)}s`;
    this.statsBarEl.appendChild(meta);
    updateActionsStickyTop();
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
        const mult = getEffectivePrestigeBonus(gameState);
        r.add(r.rpc * mult);
        this.renderStatsBar();
        this.renderUpgrades();
      };
        this.actionsEl.appendChild(btn);
      });
    updateActionsStickyTop();
  }

  renderUpgrades() {
  if (!this.upgradeGridEl || !this.researchGridEl) return;

  this.upgradeGridEl.innerHTML = "";
  this.researchGridEl.innerHTML = "";

  const normalUpgrades = this.upgrades.filter(u => !u.research);
  const researchUpgrades = this.upgrades.filter(u => u.research);

  // Bisherige Gruppierungslogik (unlock / nach Ressource)
  const grouped = {};
  for (const upg of normalUpgrades) {
    if (upg.single && upg.unlocksResourceId) {
      grouped.unlock = grouped.unlock || [];
      grouped.unlock.push(upg);
    } else {
      const key = upg.costRes || "Sonstige";
      grouped[key] = grouped[key] || [];
      grouped[key].push(upg);
    }
  }

  // Normale Upgrades wie bisher ins upgradeGridEl
  if (grouped.unlock && grouped.unlock.length > 0) {
    const col = document.createElement("div");
    col.className = "upgrade-col upgrade-unlock-col";
    const header = document.createElement("h4");
    header.textContent = "Freischaltungen";
    col.appendChild(header);
    grouped.unlock.forEach(upg => col.appendChild(this.createUpgradeCard(upg)));
    this.upgradeGridEl.appendChild(col);
  }

  for (const [res, arr] of Object.entries(grouped)) {
    if (res === "unlock") continue;
    const col = document.createElement("div");
    col.className = "upgrade-col";
    const header = document.createElement("h4");
    header.textContent = res.charAt(0).toUpperCase() + res.slice(1);
    col.appendChild(header);
    arr.forEach(upg => col.appendChild(this.createUpgradeCard(upg)));
    this.upgradeGridEl.appendChild(col);
  }

  // Forschungs-Upgrades nach costRes gruppieren
  const researchByRes = {};
  for (const upg of researchUpgrades) {
    const key = upg.costRes || "sonstige";
    if (!researchByRes[key]) researchByRes[key] = [];
    researchByRes[key].push(upg);
  }

  for (const [res, arr] of Object.entries(researchByRes)) {
    const col = document.createElement("div");
    col.className = "upgrade-col";
    const header = document.createElement("h4");
    header.textContent = res.charAt(0).toUpperCase() + res.slice(1) + " Forschung";
    col.appendChild(header);

    arr.forEach(upg => col.appendChild(this.createUpgradeCard(upg)));
    this.researchGridEl.appendChild(col);
  }
}


  createUpgradeCard(upg) {
    const costRes = this.getResource(upg.costRes);
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = upg.name;
    const desc = document.createElement('p');
    desc.textContent = upg.desc;
    const costP = document.createElement('p');
    const cost = upg.getCurrentCost();
    costP.textContent = costRes
      ? `Kosten: ${formatAmount(cost)} ${costRes.name}`
      : '';
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
      if (upg.buy(this)) {
        this.recalculateResourceBonuses();
        this.renderAll();
      }
    };
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(costP);
    card.appendChild(owned);
    card.appendChild(btn);
    if (costRes) {
    const current = costRes.amount;
    const nextCost = upg.getCurrentCost();
    const percent = Math.min(100, (current / nextCost) * 100);
  
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
  
    const progress = document.createElement('div');
    progress.className = 'progress';
    progress.style.width = percent + '%';
  
    progressBar.appendChild(progress);
  
    // Balken nach dem Button einfügen!
    card.appendChild(progressBar);
  }

    return card;
  }

  renderPrestigeContainer() {
    const el = document.getElementById('prestigeContainer');
    if (!el) return;
    // Prestige aus neuem Modul:
    const pointsNow = calculatePrestigePoints(gameState);
    const gained = pointsNow - (gameState.prestige || 0);
    const effBonus = getEffectivePrestigeBonus(gameState);
    el.innerHTML = `
      <div class="prestige-info">
        <strong>Prestige-Punkte:</strong> ${gameState.prestige}<br>
        <strong>Bonus</strong> x${effBonus.toFixed(2)}<br>
        <strong>Möglich:</strong> +${gained} neue Punkte
      </div>
      <button id="prestigeBtn" class="buy-btn" ${gained > 0 ? '' : 'disabled'}>
        Prestige durchführen (+${gained} neue Punkte)
      </button>
      <div style="font-size:12px; color:#9aa4b6; margin-top:5px">
        Alle Ressourcen tragen zum Prestige-Fortschritt bei.<br>
        Je höherwertiger, desto mehr Prestige!
      </div>
    `;
    document.getElementById('prestigeBtn').onclick = () => {
      doPrestige(this, gameState);
    };
  }

  renderPrestigeUpgrades() {
    const el = document.getElementById('prestigeUpgrades');
    if (!el) return;
    el.innerHTML = '<h3>Prestige Upgrades</h3>';
    this.prestigeUpgrades.forEach(upg => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <strong>${upg.name}</strong><br>
        <span>${upg.desc}</span><br>
        <span>Kosten: ${upg.getCurrentCost()} Prestige-Punkte</span><br>
        <span>Level: ${upg.level}</span>
      `;
      const btn = document.createElement('button');
      btn.className = 'buy-btn';
      btn.disabled = !upg.canBuy(gameState);
      btn.textContent = upg.single && upg.level > 0 ? 'Gekauft' : (btn.disabled ? 'Nicht genug' : 'Kaufen');
      btn.onclick = () => {
        if (upg.buy(this, gameState)) {
          this.syncToState();
          gameState.save();
          this.renderAll();
        }
      };
      card.appendChild(btn);
      el.appendChild(card);
    });
  }

  renderAll() {
    this.renderStatsBar();
    this.renderActions();
    this.renderUpgrades();
    this.renderPrestigeContainer();
    this.renderPrestigeUpgrades();
  }

  startTick() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = setInterval(() => this.tick(), this.tickMs);
  }
  tick() {
  const mult = getEffectivePrestigeBonus(gameState);
  Object.values(this.resources).forEach(r => {
    if (r.unlocked && r.rps > 0) {
      r.add(r.rps * mult);
    }
  });
  this.renderStatsBar();
  this.renderUpgrades();
}
}

// Bootstrap
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
