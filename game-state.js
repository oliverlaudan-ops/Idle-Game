// game-state.js

export class GameState {
  constructor() {
    let storageValue = localStorage.getItem("gameState");
    let savedState = null;

    if (storageValue && storageValue !== "undefined") {
      try {
        savedState = JSON.parse(storageValue);
        Object.assign(this, savedState);
      } catch (e) {
        // Ignoriere kaputte Saves, verwende Default
      }
      // Offline-Progress Tracking
      this.lastOnline = this.lastOnline ?? Date.now();
    }

    // Fallback-Defaults (wird nur gesetzt, falls Werte nicht bereits existieren)
    this.stein       = this.stein       ?? 0;
    this.holz        = this.holz        ?? 0;
    this.metall      = this.metall      ?? 0;
    this.kristall    = this.kristall    ?? 0;
    this.ton         = this.ton         ?? 0;

    // Optional: Gesamtverdienst-Tracking nach Ressource
    this.totalEarned = this.totalEarned ?? {
      stein: 0,
      holz: 0,
      metall: 0,
      kristall: 0,
      ton: 0
    };

    this.upgrades          = this.upgrades          ?? [];
    this.prestigeUpgrades  = this.prestigeUpgrades  ?? [];

    // Prestige-System
    this.prestige           = this.prestige           ?? 0;

    // Basis-Bonus nur aus Prestige-Punkten (wird in doPrestige gesetzt)
    this.prestigeBaseBonus  = this.prestigeBaseBonus  ?? 1;

    // Multiplikator aus Prestige-Upgrades (z. B. Globaler Multiplikator)
    this.prestigeUpgradeMult = this.prestigeUpgradeMult ?? 1;

    // Sonstige Prestige-Flags
    this.hasOfflineBonus    = this.hasOfflineBonus    ?? false;

    // Offline-Tracking
    this.lastOnline = this.lastOnline ?? Date.now();


    this.save();
  }

  // Spielstand speichern
  save() {
    this.lastOnline = Date.now(); // ← Zeitstempel aktualisieren
    localStorage.setItem("gameState", JSON.stringify(this));
  }

  // Spielstand zurücksetzen (alles außer Prestige)
  reset() {
    if (confirm("Wirklich alles zurücksetzen?")) {
      localStorage.removeItem("gameState");

      this.stein    = 0;
      this.holz     = 0;
      this.metall   = 0;
      this.kristall = 0;
      this.ton      = 0;

      this.totalEarned = {
        stein: 0,
        holz: 0,
        metall: 0,
        kristall: 0,
        ton: 0
      };

      this.upgrades         = [];
      // Prestige-Punkte + Prestige-Upgrades bleiben erhalten
      this.save();
      alert("Zurückgesetzt!");
    }
  }

  // Export: Serialisiert und kodiert den Spielstand als Base64
  export() {
    const savedState = JSON.stringify(this);
    const encoded = btoa(savedState);
    alert("Exportiert: " + encoded);
    return encoded;
  }

  // Importiert und setzt einen Spielstand aus einem Base64-String
  import(encodedState) {
    try {
      const decoded = atob(encodedState);
      const parsedState = JSON.parse(decoded);
      Object.assign(this, parsedState);
      this.save();
      alert("Import erfolgreich!");
    } catch (e) {
      alert("Fehler beim Importieren: " + e.message);
    }
  }
}

const gameState = new GameState();

// WICHTIG:
export default gameState;
// Falls du die Klasse auch brauchst:
// export { GameState };
