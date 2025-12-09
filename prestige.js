// prestige.js
export const resourcePrestigeValue = { stein: 1, holz: 2, ton: 4 , metall: 10, kristall: 50};

export function calculatePrestigePoints(gameState) {
  // Map: Jede Ressource bekommt einen Wert-Faktor pro Prestige-System
  const resourcePrestigeValue = {
    stein: 1,      // 1 Mio Stein = 1 Prestigepunkt
    holz: 2,       // 0.5 Mio Holz = 1 Punkt
    metall: 10,    // 0.1 Mio Metall = 1 Punkt
    kristall: 50,  // 20k Kristall = 1 Punkt
    ton: 4         // 0.25 Mio Ton = 1 Punkt
  };

  let total = 0;
  // Gehe alle Ressourcen durch, die relevant sind
  for (const res in resourcePrestigeValue) {
    // Hole die „totalEarned“-Menge (oder aktuellen Stand, falls nicht vorhanden)
    const earned = (gameState.totalEarned && gameState.totalEarned[res]) || gameState[res] || 0;

    // Teile den Wert durch das Prestigelimit dieser Ressource
    // Beispiel: 2,000,000 Stein / 1,000,000 = 2 Prestige-Punkte aus Stein
    total += earned / (1_000_000 / resourcePrestigeValue[res]);
  }
  // Runde am Ende ab, damit nur volle Punkte verteilt werden (keine Nachkommastellen)
  return Math.floor(total);
}

export function doPrestige(game, gameState) {
  // Berechne das berechtigte Prestige nach aktuellem Stand
  const totalPrestige = calculatePrestigePoints(gameState);

  // Wieviel wäre „neu“? (Maximalwert minus schon vergebene Punkte)
  const gained = totalPrestige - (gameState.prestige || 0);

  // Wenn nichts zu gewinnen, brich ab
  if (gained <= 0) return false;

  // Setze den Prestige-Zähler
  gameState.prestige = totalPrestige;
  
  // Neuer Prestige-Basis-Bonus: sanftere Wurzel-Skalierung
  const p = gameState.prestige;
  gameState.prestigeBaseBonus = 1 + Math.sqrt(p) * 0.1;
  
  // NICHT mehr: gameState.prestigeBonus = ...

  // Setze alle Ressourcen auf null (Soft-Reset)
  for (const key in game.resources) {
    game.resources[key].amount = 0;
    gameState[key] = 0;
    if (key !== 'stein') game.resources[key].unlocked = false;
  }
  // Setze alle Upgrade-Stufen zurück
  game.upgrades.forEach(u => u.level = 0);
  // Setze Prestige-Upgrades sofern nötig zurück (je nach persistent-Flag)
  game.prestigeUpgrades.forEach(u => { if (!u.persistent) u.level = 0; });

  // Aktualisiere die Boni und speichere den Spielstand
  game.recalculateResourceBonuses();
  game.syncToState();
  gameState.save();

  // Zeige eine freundliche Info an den Spieler
  const effBonus = (gameState.prestigeBaseBonus ?? 1) * (gameState.prestigeUpgradeMult ?? 1);
  alert(`Du hast ${gained} Prestige-Punkte erhalten!\nBonus jetzt: x${effBonus.toFixed(2)}`);

  // Zeichne das UI neu (alle Werte wurden ja zurückgesetzt)
  game.renderAll();
  return true;
}

