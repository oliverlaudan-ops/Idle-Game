// Spielzustand und Funktionen
const state = {
  stein: 0,
  holz: 0,
  metall: 0,
  rpsStein: 1,  // Resource Per Second for Stein
  rpsHolz: 0,   // Resource Per Second for Holz
  rpsMetall: 0, // Resource Per Second for Metall
};

// Ressourcen und Upgrades
const resources = [
  { id: 'stein', name: 'Stein', rate: 'rpsStein', unit: 'Stein' },
  { id: 'holz', name: 'Holz', rate: 'rpsHolz', unit: 'Holz' },
  { id: 'metall', name: 'Metall', rate: 'rpsMetall', unit: 'Metall' }
];

const upgrades = [
  {
    id: 'faustkeil',
    name: 'Faustkeil',
    desc: '+1 Stein/Klick',
    baseCost: 10,
    apply: () => state.rpsStein += 1, // Effekt des Upgrades
  },
  {
    id: 'werkbank',
    name: 'Werkbank',
    desc: 'Schaltet Holz frei',
    baseCost: 250,
    apply: () => state.rpsHolz += 1,  // Effekt des Upgrades
  },
  {
    id: 'sägewerk',
    name: 'Sägewerk',
    desc: '+6 Holz/Sek',
    baseCost: 400,
    apply: () => state.rpsHolz += 6,  // Effekt des Upgrades
  }
];

// Dynamisches Erstellen der Buttons und Zuweisen der Event Listener
const createResourceButtons = () => {
  const actionDiv = document.getElementById('actions');
  actionDiv.innerHTML = ''; // Vorherige Buttons entfernen

  resources.forEach(resource => {
    const button = document.createElement('button');
    button.id = `${resource.id}Btn`;
    button.textContent = `${resource.name} sammeln (+${state[resource.rate]})`;
    button.classList.add('btn');
    actionDiv.appendChild(button);

    button.addEventListener('click', () => {
      state[resource.id] += state[resource.rate]; // Erhöhe die Resource
      renderStats();
    });
  });
};

// Stats rendern
const renderStats = () => {
  resources.forEach(resource => {
    document.getElementById(`${resource.id}Stats`).textContent = `${resource.name}: ${fmt(state[resource.id])} (${fmt(state[resource.rate])}/s)`;
  });
};

// Formatierungsfunktion für Zahlen (z.B. Tausender Trennzeichen)
const fmt = (value) => {
  return value.toLocaleString(); // Formatierung als Zahl mit Tausender-Trennung
};

// Rendern der Upgrades
const renderUpgrades = () => {
  const upgradeGrid = document.getElementById('upgrade-grid');
  upgradeGrid.innerHTML = ''; // Vorherige Upgrades entfernen

  upgrades.forEach(upg => {
    const canBuy = state[upg.res] >= upg.baseCost; // Überprüfen, ob genug Ressource vorhanden ist
    const card = buildCard(upg, canBuy); // Das Upgrade in eine Karte umwandeln
    upgradeGrid.appendChild(card); // Karte zum UI hinzufügen
  });
};

// Funktion zum Erstellen der Upgrade-Karten
function buildCard(upg, canBuy) {
  const card = document.createElement('div');
  card.classList.add('card');

  const name = document.createElement('h3');
  name.textContent = upg.name;
  card.appendChild(name);

  const description = document.createElement('p');
  description.textContent = upg.desc;
  card.appendChild(description);

  const cost = document.createElement('p');
  cost.textContent = `Kosten: ${upg.baseCost} Stein`;
  card.appendChild(cost);

  const buyButton = document.createElement('button');
  buyButton.classList.add('buy');
  buyButton.textContent = canBuy ? 'Kaufen' : 'Nicht genug';
  buyButton.disabled = !canBuy; // Button ist deaktiviert, wenn nicht genug Ressourcen vorhanden sind

  buyButton.addEventListener('click', () => {
    if (canBuy) {
      state.stein -= upg.baseCost;  // Abziehen der Kosten von Stein
      upg.apply(state);  // Effekt des Upgrades anwenden
      renderStats();  // Statistiken aktualisieren
      renderUpgrades();  // Upgrades neu rendern
    }
  });

  card.appendChild(buyButton);

  return card;
}

// Funktion zum Rendern aller Inhalte
const renderAll = () => {
  renderStats();
  renderUpgrades();
};

// Eventlistener für Prestige
const prestigeBtn = document.getElementById('prestigeBtn');
prestigeBtn.addEventListener('click', () => {
  if (state.stein >= 50000) {
    alert('Prestige ausgelöst!');
    state.stein = 0;
    state.holz = 0;
    state.metall = 0;
    state.rpsStein = 1;
    state.rpsHolz = 0;
    state.rpsMetall = 0;
    renderAll();
  }
});

// Initiales Rendering, wenn das DOM bereit ist
document.addEventListener("DOMContentLoaded", () => {
  createResourceButtons();  // Buttons für jede Ressource erstellen
  renderAll();  // Alle Daten rendern
});
