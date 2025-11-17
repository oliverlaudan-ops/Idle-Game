// ======================== Spiel-Initialisierung =====================
document.addEventListener("DOMContentLoaded", () => {
  initializeGame(); // Diese Funktion kümmert sich um die Initialisierung des Spiels
});

// ======================== Spiel-Initialisierung =====================
function initializeGame() {
  // Initialisierung des Spiels, Rendern aller wichtigen Informationen
  renderAll();
  console.log('[INIT] Game initialized');
}

// ======================== Spiel-Status (state) =======================
const RESOURCES = [
  { key: 'stein', label: 'Stein' },
  { key: 'holz', label: 'Holz' },
  { key: 'metall', label: 'Metall' }
];

// State-Objekt (Spielstand)
const state = {
  stein: 0,
  holz: 0,
  metall: 0,
  rpsStein: 0, // Ressourcengenerierung pro Sekunde für Stein
  rpsHolz: 0,  // Ressourcengenerierung pro Sekunde für Holz
  rpsMetall: 0 // Ressourcengenerierung pro Sekunde für Metall
};

// ======================== Upgrades ================================

// Upgrades Array
const upgrades = [
  { id: 'faustkeil', name: 'Faustkeil', desc: '+1 Stein/Klick', res: 'stein', baseCost: 10, mult: 1.2, apply: () => state.rpsStein++ },
  { id: 'werkbank', name: 'Werkbank', desc: 'Schaltet Holz frei', res: 'stein', baseCost: 250, mult: 2.0, apply: () => state.rpsHolz = 1 },
  { id: 'steinmine', name: 'Steinmine', desc: '+8 Stein/Sek', res: 'stein', baseCost: 520, mult: 1.5, apply: () => state.rpsStein += 8 },
  { id: 'arbeitskraft', name: 'Arbeitskraft', desc: '+1 Stein/Sek', res: 'stein', baseCost: 120, mult: 1.3, apply: () => state.rpsStein += 1 },
  { id: 'holzfaeller', name: 'Holzfäller', desc: '+0.8 Holz/Sek', res: 'holz', baseCost: 240, mult: 1.5, apply: () => state.rpsHolz += 0.8 },
  { id: 'sägewerk', name: 'Sägewerk', desc: '+6 Holz/Sek', res: 'holz', baseCost: 634, mult: 1.5, apply: () => state.rpsHolz += 6 },
  { id: 'axt', name: 'Axt', desc: '+1 Holz/Klick', res: 'holz', baseCost: 167, mult: 1.2, apply: () => state.rpsHolz++ },
  { id: 'ofen', name: 'Ofen', desc: 'Verdoppelt Metall-Sammeln', res: 'metall', baseCost: 500, mult: 2.0, apply: () => state.rpsMetall *= 2 }
];

// ======================== Render-Logik ===============================

// Funktion zum Rendern der Statistiken
const renderStats = () => {
  // Alle Ressourcen durchlaufen und die Statistiken aktualisieren
  RESOURCES.forEach(resource => {
    const statEl = document.getElementById(`${resource.key}Stats`);
    if (statEl) {
      statEl.textContent = `${fmt(state[resource.key])} ${resource.label} (${fmt(state['rps_' + resource.key])}/s)`;
    }
  });
};

// Funktion zum Rendern der Upgrades
const renderUpgrades = () => {
  const upgradeGrid = document.getElementById('upgrade-grid');
  upgradeGrid.innerHTML = ''; // Vorherige Upgrades entfernen

  upgrades.forEach(upg => {
    const canBuy = state[upg.res] >= upg.baseCost; // Überprüfen, ob genug Ressourcen vorhanden sind
    const card = buildCard(upg, state[upg.id] || 0, canBuy, upg.res, function () {
      if (state[upg.res] < upg.baseCost) return; // Wenn nicht genug Ressourcen, nichts tun
      state[upg.res] -= upg.baseCost; // Abziehen der Kosten
      upg.apply(state); // Anwenden des Effekts
      upg.baseCost = Math.floor(upg.baseCost * upg.mult); // Kosten des Upgrades erhöhen
      renderStats(); // Stats aktualisieren
      renderUpgrades(); // UI mit neuen Preisen aktualisieren
    });
    upgradeGrid.appendChild(card); // Karte zum UI hinzufügen
  });
};

// Funktion zum Erstellen der Upgrade-Karten
function buildCard(upg, amount, canBuy, resourceType, onClick) {
  const card = document.createElement('div');
  card.classList.add('card');

  const name = document.createElement('h3');
  name.textContent = upg.name;
  card.appendChild(name);

  const description = document.createElement('p');
  description.textContent = upg.desc;
  card.appendChild(description);

  const cost = document.createElement('p');
  cost.textContent = `Kosten: ${upg.baseCost} ${resourceType}`;
  card.appendChild(cost);

  const buyButton = document.createElement('button');
  buyButton.classList.add('buy');
  buyButton.textContent = canBuy ? 'Kaufen' : 'Nicht genug';
  buyButton.disabled = !canBuy;

  buyButton.addEventListener('click', () => {
    if (canBuy) {
      onClick(); // Wenn der Button klickbar ist, den Upgrade-Effekt anwenden
    }
  });

  card.appendChild(buyButton);

  return card;
}

// Funktion zum Rendern aller Inhalte (Stats und Upgrades)
const renderAll = () => {
  renderStats(); // Statistiken rendern
  renderUpgrades(); // Upgrades rendern
};

// ======================== Event Listener ================================

// Event Listener für das Sammeln von Ressourcen
document.getElementById('steinBtn').addEventListener('click', () => {
  state.stein += state.rpsStein;
  renderStats();
});

document.getElementById('holzBtn').addEventListener('click', () => {
  state.holz += state.rpsHolz;
  renderStats();
});

document.getElementById('metallBtn').addEventListener('click', () => {
  state.metall += state.rpsMetall;
  renderStats();
});

// ======================== Hilfsfunktionen ==============================

// Formatierungsfunktion für Zahlen (optional)
const fmt = num => {
  return num.toFixed(1);
};

