// game-state.js

export class GameState {
  constructor() {
    let storageValue = localStorage.getItem("gameState");
    let savedState = null;
    if (storageValue && storageValue !== "undefined") {
      try {
        savedState = JSON.parse(storageValue);
        Object.assign(this, savedState);
      } catch (e) {}
    }
    // Fallback-Defaults (wird nur gesetzt, falls Wer­te nicht bereits existieren)
    this.stein = this.stein ?? 0;
    this.holz = this.holz ?? 0;
    this.metall = this.metall ?? 0;
    this.kristall = this.kristall ?? 0;
    this.totalEarned = this.totalEarned ?? 0;
    this.upgrades = this.upgrades ?? [];
    // Prestige-System:
    this.prestige = this.prestige ?? 0;
    this.prestigeBonus = this.prestigeBonus ?? 1;
    this.globalMult = this.globalMult ?? 1;
    this.save();
  }

  // Spielstand speichern
  save() {
    localStorage.setItem('gameState', JSON.stringify(this));
  }

  // Spielstand zurücksetzen (alles außer Prestige)
  reset() {
    if (confirm('Wirklich alles zurücksetzen?')) {
      localStorage.removeItem('gameState');
      this.stein = 0;
      this.holz = 0;
      this.metall = 0;
      this.kristall = 0;
      this.totalEarned = 0;
      this.upgrades = [];
      // Prestige bleibt erhalten!
      this.save();
      alert('Zurückgesetzt!');
    }
  }

  // Export: Serialisiert und kodiert den Spielstand als Base64
  export() {
    const savedState = JSON.stringify(this);
    const encoded = btoa(savedState);
    alert('Exportiert: ' + encoded);
    return encoded;
  }

  // Importiert und setzt einen Spielstand aus einem Base64-String
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

