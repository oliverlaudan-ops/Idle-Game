/**
 * achievement.js
 * Basis-Klasse für Achievements
 */

export class Achievement {
  constructor({
    id,
    name,
    desc,
    category = 'general',
    icon = '🏆',
    checkFn,
    rewardFn = null,
    hidden = false,
    progressFn = null, // Optional: Für Fortschrittsanzeige
    maxProgress = 0     // Optional: Zielwert für Fortschritt
  }) {
    this.id = id;
    this.name = name;
    this.desc = desc;
    this.category = category;
    this.icon = icon;
    this.checkFn = checkFn;      // Funktion: (game) => boolean
    this.rewardFn = rewardFn;    // Optional: (game) => void
    this.hidden = hidden;        // Versteckt bis unlock
    this.progressFn = progressFn; // Optional: (game) => number
    this.maxProgress = maxProgress;
    
    // Status
    this.unlocked = false;
    this.unlockedAt = null;      // Timestamp
    this.progress = 0;           // Aktueller Fortschritt
  }

  // Prüft, ob Achievement erfüllt ist
  check(game) {
    if (this.unlocked) return false;
    
    // Fortschritt aktualisieren (falls vorhanden)
    if (this.progressFn) {
      this.progress = this.progressFn(game);
    }
    
    // Check durchführen
    const isComplete = this.checkFn(game);
    
    if (isComplete) {
      this.unlock(game);
      return true;
    }
    
    return false;
  }

  // Schaltet Achievement frei
  unlock(game) {
    if (this.unlocked) return;
    
    this.unlocked = true;
    this.unlockedAt = Date.now();
    
    // Belohnung ausführen (falls vorhanden)
    if (this.rewardFn) {
      this.rewardFn(game);
    }
  }

  // Gibt Fortschritt in Prozent zurück
  getProgressPercent() {
    if (!this.progressFn || this.maxProgress === 0) return 0;
    return Math.min(100, (this.progress / this.maxProgress) * 100);
  }

  // Serialisierung für Save/Load
  toJSON() {
    return {
      id: this.id,
      unlocked: this.unlocked,
      unlockedAt: this.unlockedAt,
      progress: this.progress
    };
  }

  // Lädt Status aus gespeicherten Daten
  loadFromSave(data) {
    this.unlocked = data.unlocked || false;
    this.unlockedAt = data.unlockedAt || null;
    this.progress = data.progress || 0;
  }
}

