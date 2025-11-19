class Game {
  constructor() {
    this.stein = 0;
    this.holz = 0;
    this.metal = 0;
    this.kristall = 0;
    this.upgrades = [
      {
        name: "Faustkeil",
        cost: 10,
        effect: () => { this.stein += 1; },
        purchased: false
      },
      {
        name: "Werkbank",
        cost: 250,
        effect: () => { this.holz += 1; },
        purchased: false
      },
      // Weitere Upgrades hier hinzufügen
    ];
    this.load();
    this.render();
  }

  save() {
    const gameState = {
      stein: this.stein,
      holz: this.holz,
      metal: this.metal,
      kristall: this.kristall,
      upgrades: this.upgrades.map(upg => upg.purchased),
    };

    const gameStateString = JSON.stringify(gameState); 
    const encoded = btoa(gameStateString); 
    localStorage.setItem('stone_idle_save_v2', encoded); 
  }

  load() {
    const savedGame = localStorage.getItem('stone_idle_save_v2');
    if (savedGame) {
      const decoded = atob(savedGame);
      const gameState = JSON.parse(decoded);
      this.stein = gameState.stein;
      this.holz = gameState.holz;
      this.metal = gameState.metal;
      this.kristall = gameState.kristall;
      this.upgrades.forEach((upg, idx) => {
        upg.purchased = gameState.upgrades[idx];
      });
    }
  }

  export() {
    const gameState = {
      stein: this.stein,
      holz: this.holz,
      metal: this.metal,
      kristall: this.kristall,
      upgrades: this.upgrades.map(upg => upg.purchased),
    };
    const gameStateString = JSON.stringify(gameState); 
    const encoded = btoa(gameStateString); 
    
    // Export String kopieren
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
      this.stein = gameState.stein;
      this.holz = gameState.holz;
      this.metal = gameState.metal;
      this.kristall = gameState.kristall;
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
      this.stein = 0;
      this.holz = 0;
      this.metal = 0;
      this.kristall = 0;
      this.upgrades.forEach(upg => upg.purchased = false);
      this.render();
    }
  }

  render() {
    document.getElementById('sbStein').textContent = `Stein: ${this.stein}`;
    document.getElementById('sbHolz').textContent = `Holz: ${this.holz}`;
    document.getElementById('sbMetall').textContent = `Metall: ${this.metal}`;
    
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
      button.disabled = upg.purchased || this.stein < upg.cost;
      button.addEventListener('click', () => {
        if (!upg.purchased && this.stein >= upg.cost) {
          this.stein -= upg.cost;
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
