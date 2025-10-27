// Spielzustand und Funktionen
const state = {
  stein: 0,
  holz: 0,
  rpcStein: 1,
  rpcHolz: 0,
  totalEarned: 0,
};

// Upgrades
const upgrades = [
  { id: 'faustkeil', name: 'Faustkeil', desc: '+1 Stein/Klick', baseCost: 10, mult: 1.15, apply: () => state.rpcStein++ },
  { id: 'werkbank', name: 'Werkbank', desc: 'Schaltet Holz frei', baseCost: 250, mult: 2.5, apply: () => (state.rpcHolz = 1) },
];

// DOM-Elemente referenzieren
const clickSteinBtn = document.getElementById('steinBtn');
const prestigeBtn = document.getElementById('prestigeBtn');

// Funktion zum Rendern der Statistiken
const renderStats = () => {
  document.getElementById('steinStats').textContent = `Stein: ${state.stein}`;
  document.getElementById('holzStats').textContent = `Holz: ${state.holz}`;
};

// Funktion zum Rendern der Upgrades
const renderUpgrades = () => {
  const upgradeGrid = document.getElementById('upgrade-grid');
  upgradeGrid.innerHTML = ''; // Vorherige Upgrades entfernen

  upgrades.forEach(upg => {
    const canBuy = state.stein >= upg.baseCost; // Überprüfen, ob der Spieler genug hat
    const card = buildCard(upg, state[upg.id] || 0, canBuy, 'Stein', function () {
      if (state.stein < upg.baseCost) return; // Wenn nicht genug Stein vorhanden, nichts tun
      state.stein -= upg.baseCost; // Abziehen der Kosten
      upg.apply(); // Anwenden des Effekts
      upg.baseCost = Math.floor(upg.baseCost * upg.mult); // Kosten des Upgrades erhöhen
      renderStats(); // Stats aktualisieren
      renderUpgrades(); // UI mit neuen Preisen aktualisieren
    });
    upgradeGrid.appendChild(card); // Karte hinzufügen
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
  renderStats();
  renderUpgrades();
};

// Eventlistener für Stein sammeln
clickSteinBtn.addEventListener('click', () => {
  state.stein += state.rpcStein;
  state.totalEarned += state.rpcStein;
  renderAll();
});

// Eventlistener für Prestige
prestigeBtn.addEventListener('click', () => {
  if (state.stein >= 50000) {
    alert('Prestige ausgelöst!');
    state.stein = 0;
    state.holz = 0;
    state.rpcStein = 1;
    renderAll();
  }
});

// Initiales Rendering, wenn das DOM bereit ist
document.addEventListener("DOMContentLoaded", renderAll);
