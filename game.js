class Resource {
  constructor(name, symbol, startingValue, rate) {
    this.name = name;
    this.symbol = symbol;
    this.value = startingValue;
    this.rate = rate; // Rate per second
    this.perClick = 1; // Pro Klick
  }

  increment() {
    this.value += this.perClick;
  }

  incrementRate() {
    this.value += this.rate;
  }

  getDisplayValue() {
    return `${this.formatNumber(this.value)} ${this.symbol}`;
  }

  formatNumber(value) {
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value;
  }
}

class Game {
  constructor() {
    this.resources = {
      stein: new Resource("Stein", "🪨", 0, 1), // Stein, Symbol, Startwert, Rate pro Sekunde
      holz: new Resource("Holz", "🌲", 0, 0),
      metal: new Resource("Metall", "⚒️", 0, 0),
      kristall: new Resource("Kristall", "💎", 0, 0),
    };

    this.upgrades = [
      {
        name: "Faustkeil",
        cost: 10,
        effect: () => { this.resources.stein.perClick++; },
        purchased: false
      },
      {
        name: "Werkbank",
        cost: 250,
        effect: () => { this.resources.holz.perClick++; },
        purchased: false
      },
      // Weitere Upgrades hier hinzufügen
    ];

    this.load();
    this.render();
  }

  save() {
    const gameState = {
      resources: Object.keys(this.resources).reduce((acc, key) => {
        acc[key] = {
          value: this.resources[key].value,
          perClick: this.resources[key].perClick
        };
        return acc;
      }, {}),
      upgrades: this.upgrades.map(upg => upg.purchased)
    };

    const gameStateString = JSON.stringify(gameState);
    localStorage.setItem('stone_idle_save_v2', btoa(gameStateString));
  }

  load() {
    const savedGame = localStorage.getItem('stone_idle_save_v2');
    if (savedGame) {
      const gameState = JSON.parse(atob(savedGame));
      Object.keys(this.resources).forEach(key => {
        this.resources[key].value = gameState.resources[key].value;
        this.resources[key].perClick = gameState.resources[key].perClick;
      });
      this.upgrades.forEach((upg, idx) => {
        upg.purchased = gameState.upgrades[idx];
      });
    }
  }

  export() {
    const gameState = {
      resources: Object.keys(this.resources).reduce((acc, key) => {
        acc[key] = {
          value: this.resources[key].value,
          perClick: this.resources[key].perClick
        };
        return acc;
      }, {}),
      upgrades: this.upgrades.map(upg => upg.purchased)
    };
    const gameStateString = JSON.stringify(gameState);
    const encoded = btoa(gameStateString);

    navigator.clipboard.writeText(encoded).then(() => {
      alert('Exportiert und in die Zwischenablage kopiert!');
    }).catch(err => {
      alert('Fehler beim Kopieren: ' + err);
    });
  }

  import(exportString) {
    try {
      const decoded = atob(exportString);
      const gameState = JSON.parse(decoded);
      Object.keys(this.resources).forEach(key => {
        this.resources[key].value = gameState.resources[key].value;
        this.resources[key].perClick = gameState.resources[key].perClick;
      });
      this.upgrades.forEach((upg, idx) => {
        upg.purchased = gameState.upgrades[idx];
      });
      this.render();
    } catch (e) {
      alert('Import fehlgeschlagen: ' + e.message);
    }
  }

  reset() {
    if (confirm('Wirklich alles zurücksetzen?')) {
      localStorage.removeItem('stone_idle_save_v2');
      Object.keys(this.resources).forEach(key => {
        this.resources[key].value = 0;
        this.resources[key].perClick = 1;
      });
      this.upgrades.forEach(upg => upg.purchased = false);
      this.render();
    }
  }

  render() {
    Object.keys(this.resources).forEach(key => {
      document.getElementById(`sb${key.charAt(0).toUpperCase() + key.slice(1)}`).textContent = this.resources[key].getDisplayValue();
    });

    this.renderUpgrades();
  }

  renderUpgrades() {
    const upgradeGrid = document.getElementById('upgrade-grid');
    upgradeGrid.innerHTML = '';

    this.upgrades.forEach(upg => {
      const card = document.createElement('div');
      card.classList.add('card');
      
      const name = document.createElement('h3');
      name.textContent = upg.name;
      card.appendChild(name);

      const cost = document.createElement('p');
      cost.textContent = `Kosten: ${upg.cost} Stein`;
      card.appendChild(cost);

      const button = document.createElement('button');
      button.textContent = upg.purchased ? 'Gekauft' : 'Kaufen';
      button.disabled = upg.purchased || this.resources.stein.value < upg.cost;
      button.addEventListener('click', () => {
        if (!upg.purchased && this.resources.stein.value >= upg.cost) {
          this.resources.stein.value -= upg.cost;
          upg.effect();
          upg.purchased = true;
          this.render();
        }
      });
      card.appendChild(button);

      upgradeGrid.appendChild(card);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();

  document.getElementById('saveBtn').addEventListener('click', () => game.save());
  document.getElementById('resetBtn').addEventListener('click', () => game.reset());
  document.getElementById('exportBtn').addEventListener('click', () => game.export());
  document.getElementById('importBtn').addEventListener('click', () => {
    const exportString = prompt('Export-String einfügen:');
    if (exportString) game.import(exportString);
  });
});
