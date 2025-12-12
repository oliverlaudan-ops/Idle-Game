// resource.js
import gameState from './game-state.js';

export class Resource {
  constructor(id, name, icon, rpc = 1, rps = 0, unlocked = true){
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.amount = 0;
    this.rpc = rpc;    // Ressourcen pro Klick
    this.rps = rps;    // Ressourcen pro Sekunde
    this.unlocked = unlocked;
  }

  add(amount) {
    this.amount += amount;

    // TotalEarned mitzählen (falls im State vorhanden)
    if (!gameState.totalEarned) {
      gameState.totalEarned = {};
    }
    if (typeof gameState.totalEarned[this.id] !== 'number') {
      gameState.totalEarned[this.id] = 0;
    }
    gameState.totalEarned[this.id] += amount;
  }

  spend(n){
    if (this.amount >= n){
      this.amount -= n;
      return true;
    }
    return false;
  }
}

