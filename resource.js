// resource.js

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

  add(n){
    // Beachte: Der Prestige-Bonus wird von der Spiel-Logik (im Game) beim Aufruf add() ergänzt!
    this.amount += n;
  }

  spend(n){
    if (this.amount >= n){
      this.amount -= n;
      return true;
    }
    return false;
  }
}

