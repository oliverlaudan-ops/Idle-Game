// Spielzustand und Funktionen
const state = {
  stein: 0,
  holz: 0,
  rpcStein: 1,
  rpcHolz: 0,
  totalEarned: 0,
};

const upgrades = [
  { id: 'faustkeil', name: 'Faustkeil', desc: '+1 Stein/Klick', baseCost: 10, mult: 1.15, apply: () => state.rpcStein++ },
  { id: 'werkbank', name: 'Werkbank', desc: 'Schaltet Holz frei', baseCost: 250, mult: 2.5, apply: () => (state.rpcHolz = 1) },
];

// Statistiken rendern
const renderStats = () => {
  document.getElementById('steinStats').textContent = `Stein: ${state.stein}`;
  document.getElementById('holzStats').textContent = `Holz: ${state.holz}`;
};

// Upgrades rendern
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
      renderUpgrades();
      renderStats();
    });
    upgradeGrid.appendChild(card); // Karte hinzufügen
  });
};

// Alle rendern
const renderAll = () => {
  renderStats();
  renderUpgrades();
};

// Eventlistener für Stein sammeln
document.getElementById('steinBtn').addEventListener('click', () => {
  state.stein += state.rpcStein;
  state.totalEarned += state.rpcStein;
  renderStats();
});

// Prestige auslösen
document.getElementById('prestigeBtn').addEventListener('click', () => {
  if (state.stein >= 50000) {
    alert('Prestige ausgelöst!');
    state.stein = 0;
    state.holz = 0;
    state.rpcStein = 1;
    renderAll();
  }
});

// Initiales Rendering
document.addEventListener("DOMContentLoaded", renderAll);
