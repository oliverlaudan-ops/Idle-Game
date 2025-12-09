/**
 * ui-render.js
 * Alle Rendering- und Formatierungsfunktionen
 */

import gameState from './game-state.js';
import { getEffectivePrestigeBonus } from './prestige.js';

// ========== Formatierungs-Hilfsfunktionen ==========

export function formatAmount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(0);
}

export function formatRate(n) {
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs < 1) return n.toFixed(2);
  if (abs < 1000) return n.toFixed(1);
  return formatAmount(n);
}

// ========== Stats Bar Rendering ==========

export function renderStatsBar(game) {
  if (!game.statsBarEl) return;
  
  game.statsBarEl.innerHTML = '';
  
  const resList = Object.values(game.resources).filter(r => r.unlocked);
  
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
    game.statsBarEl.appendChild(pill);
  });
  
  // Meta-Informationen
  const meta = document.createElement('div');
  meta.className = 'stat-meta';
  meta.textContent = `Tick: ${(game.tickMs / 1000).toFixed(1)}s`;
  game.statsBarEl.appendChild(meta);
  
  updateActionsStickyTop();
}

// ========== Actions Rendering ==========

export function renderActions(game) {
  if (!game.actionsEl) return;
  
  game.actionsEl.innerHTML = '';
  
  Object.values(game.resources)
    .filter(r => r.unlocked)
    .forEach(r => {
      const btn = document.createElement('button');
      btn.className = `action-btn ${r.id}`;
      btn.id = r.id + 'Btn';
      btn.textContent = `${r.icon} ${r.name} sammeln (+${formatRate(r.rpc)})`;
      
      btn.onclick = () => {
        const mult = getEffectivePrestigeBonus(gameState);
        r.add(r.rpc * mult);
        renderStatsBar(game);
        renderUpgrades(game);
      };
      
      game.actionsEl.appendChild(btn);
    });
  
  updateActionsStickyTop();
}

// ========== Upgrades Rendering ==========

export function renderUpgrades(game) {
  if (!game.upgradeGridEl || !game.researchGridEl) return;
  
  game.upgradeGridEl.innerHTML = '';
  game.researchGridEl.innerHTML = '';
  
  // Upgrades nach Typ trennen
  const normalUpgrades = game.upgrades.filter(u => !u.research);
  const researchUpgrades = game.upgrades.filter(u => u.research);
  
  // Normale Upgrades gruppieren
  const grouped = {};
  for (const upg of normalUpgrades) {
    if (upg.single && upg.unlocksResourceId) {
      grouped.unlock = grouped.unlock || [];
      grouped.unlock.push(upg);
    } else {
      const key = upg.costRes || 'Sonstige';
      grouped[key] = grouped[key] || [];
      grouped[key].push(upg);
    }
  }
  
  // Freischaltungen zuerst rendern
  if (grouped.unlock && grouped.unlock.length > 0) {
    const col = document.createElement('div');
    col.className = 'upgrade-col upgrade-unlock-col';
    
    const header = document.createElement('h4');
    header.textContent = 'Freischaltungen';
    col.appendChild(header);
    
    grouped.unlock.forEach(upg => col.appendChild(createUpgradeCard(game, upg)));
    game.upgradeGridEl.appendChild(col);
  }
  
  // Restliche normale Upgrades nach Ressource
  for (const [res, arr] of Object.entries(grouped)) {
    if (res === 'unlock') continue;
    
    const col = document.createElement('div');
    col.className = 'upgrade-col';
    
    const header = document.createElement('h4');
    header.textContent = res.charAt(0).toUpperCase() + res.slice(1);
    col.appendChild(header);
    
    arr.forEach(upg => col.appendChild(createUpgradeCard(game, upg)));
    game.upgradeGridEl.appendChild(col);
  }
  
  // Forschungs-Upgrades nach costRes gruppieren
  const researchByRes = {};
  for (const upg of researchUpgrades) {
    const key = upg.costRes || 'sonstige';
    if (!researchByRes[key]) researchByRes[key] = [];
    researchByRes[key].push(upg);
  }
  
  for (const [res, arr] of Object.entries(researchByRes)) {
    const col = document.createElement('div');
    col.className = 'upgrade-col';
    
    const header = document.createElement('h4');
    header.textContent = res.charAt(0).toUpperCase() + res.slice(1) + ' Forschung';
    col.appendChild(header);
    
    arr.forEach(upg => col.appendChild(createUpgradeCard(game, upg)));
    game.researchGridEl.appendChild(col);
  }
}

// ========== Upgrade Card Creation ==========

export function createUpgradeCard(game, upg) {
  const costRes = game.getResource(upg.costRes);
  
  const card = document.createElement('div');
  card.className = 'card';
  
  // Titel
  const title = document.createElement('h3');
  title.textContent = upg.name;
  
  // Beschreibung
  const desc = document.createElement('p');
  desc.textContent = upg.desc;
  
  // Kosten
  const costP = document.createElement('p');
  const cost = upg.getCurrentCost();
  costP.textContent = costRes ? `Kosten: ${formatAmount(cost)} ${costRes.name}` : '';
  
  // Besitzstatus
  const owned = document.createElement('p');
  owned.className = 'muted';
  owned.textContent = upg.single 
    ? (upg.level > 0 ? 'Einmalig – bereits gekauft' : 'Einmalig')
    : `Stufe: ${upg.level}`;
  
  // Kauf-Button
  const btn = document.createElement('button');
  btn.className = 'buy-btn';
  const canBuy = upg.canBuy(game);
  btn.disabled = !canBuy;
  btn.textContent = upg.single && upg.level > 0 
    ? 'Gekauft' 
    : (canBuy ? 'Kaufen' : 'Nicht genug');
  
  btn.onclick = () => {
    if (upg.buy(game)) {
      game.recalculateResourceBonuses();
      renderAll(game);
    }
  };
  
  // Card zusammenbauen
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(costP);
  card.appendChild(owned);
  card.appendChild(btn);
  
  // Progress Bar
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
    card.appendChild(progressBar);
  }
  
  return card;
}

// ========== Prestige Container Rendering ==========

export function renderPrestigeContainer(game) {
  const el = document.getElementById('prestigeContainer');
  if (!el) return;
  
  const info = game.getPrestigeInfo();
  
  el.innerHTML = `
    <h3>🌟 Prestige</h3>
    <p>Aktuelle Prestige-Punkte: <strong>${info.currentPoints}</strong></p>
    <p>Effektiver Bonus: <strong>×${info.effectiveBonus.toFixed(2)}</strong></p>
    <p>Bei Prestige erhältst du: <strong>+${info.gained}</strong> Punkte</p>
    <button id="prestigeBtn" class="prestige-btn" ${game.canPrestige() ? '' : 'disabled'}>
      Prestige ausführen (${game.canPrestige() ? 'Bereit' : 'Benötigt 1000 Stein'})
    </button>
  `;
  
  const prestigeBtn = document.getElementById('prestigeBtn');
  if (prestigeBtn) {
    prestigeBtn.onclick = () => {
      if (game.performPrestige()) {
        renderAll(game);
        alert(`Prestige erfolgreich! Du hast ${info.gained} Punkte erhalten.`);
      }
    };
  }
  
  renderPrestigeUpgrades(game);
}

// ========== Prestige Upgrades Rendering ==========

export function renderPrestigeUpgrades(game) {
  const grid = document.getElementById('prestigeUpgradeGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  game.prestigeUpgrades.forEach(upg => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const title = document.createElement('h3');
    title.textContent = upg.name;
    
    const desc = document.createElement('p');
    desc.textContent = upg.desc;
    
    const costP = document.createElement('p');
    const cost = upg.getCurrentCost();
    costP.textContent = `Kosten: ${cost} Prestige-Punkte`;
    
    const owned = document.createElement('p');
    owned.className = 'muted';
    owned.textContent = `Stufe: ${upg.level}`;
    
    const btn = document.createElement('button');
    btn.className = 'buy-btn';
    const canBuy = upg.canBuy(gameState);
    btn.disabled = !canBuy;
    btn.textContent = canBuy ? 'Kaufen' : 'Nicht genug Punkte';
    
    btn.onclick = () => {
      if (upg.buy(gameState)) {
        game.syncToState();
        renderPrestigeContainer(game);
        renderStatsBar(game);
      }
    };
    
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(costP);
    card.appendChild(owned);
    card.appendChild(btn);
    
    grid.appendChild(card);
  });
}

// ========== Utility Functions ==========

export function updateActionsStickyTop() {
  const statsBar = document.querySelector('.stats-bar');
  const actions = document.querySelector('.actions');
  
  if (statsBar && actions) {
    const barHeight = statsBar.offsetHeight;
    actions.style.top = (barHeight + 12) + 'px'; // 12px Abstand
  }
}

// ========== Render All ==========

export function renderAll(game) {
  renderStatsBar(game);
  renderActions(game);
  renderUpgrades(game);
  renderPrestigeContainer(game);
}
