/**
 * achievements-list.js
 * Alle Achievement-Definitionen
 */

import { Achievement } from './achievement-class.js';

const achievementsList = [
  // ========== SAMMLER ==========
  
  new Achievement({
    id: 'first_stone',
    name: 'Erste Schritte',
    desc: 'Sammle deinen ersten Stein',
    category: 'sammler',
    icon: '🪨',
    checkFn: (game) => game.getResource('stein').amount >= 1
  }),

  new Achievement({
    id: 'stone_100',
    name: 'Steinsammler',
    desc: 'Sammle 100 Steine',
    category: 'sammler',
    icon: '⛰️',
    checkFn: (game) => game.getResource('stein').amount >= 100,
    progressFn: (game) => game.getResource('stein').amount,
    maxProgress: 100
  }),

  new Achievement({
    id: 'stone_1000',
    name: 'Steinhaufen',
    desc: 'Sammle 1.000 Steine',
    category: 'sammler',
    icon: '🏔️',
    checkFn: (game) => game.getResource('stein').amount >= 1000,
    progressFn: (game) => game.getResource('stein').amount,
    maxProgress: 1000,
    rewardFn: (game) => {
      game.getResource('stein').rpc += 1;
    }
  }),

  new Achievement({
    id: 'stone_1m',
    name: 'Steinberg',
    desc: 'Sammle 1.000.000 Steine',
    category: 'sammler',
    icon: '🗻',
    checkFn: (game) => game.getResource('stein').amount >= 1_000_000,
    progressFn: (game) => game.getResource('stein').amount,
    maxProgress: 1_000_000,
    rewardFn: (game) => {
      game.getResource('stein').rps *= 1.1;
    }
  }),

  new Achievement({
    id: 'wood_unlock',
    name: 'Waldarbeiter',
    desc: 'Schalte Holz frei',
    category: 'sammler',
    icon: '🪵',
    checkFn: (game) => game.getResource('holz').unlocked
  }),

  new Achievement({
    id: 'wood_10k',
    name: 'Holzfäller-Meister',
    desc: 'Sammle 10.000 Holz',
    category: 'sammler',
    icon: '🌲',
    checkFn: (game) => game.getResource('holz').amount >= 10_000,
    progressFn: (game) => game.getResource('holz').amount,
    maxProgress: 10_000
  }),

  new Achievement({
    id: 'metal_unlock',
    name: 'Schmied',
    desc: 'Schalte Metall frei',
    category: 'sammler',
    icon: '⚒️',
    checkFn: (game) => game.getResource('metall').unlocked
  }),

  new Achievement({
    id: 'crystal_unlock',
    name: 'Kristallsucher',
    desc: 'Schalte Kristall frei',
    category: 'sammler',
    icon: '💎',
    checkFn: (game) => game.getResource('kristall').unlocked
  }),

  new Achievement({
    id: 'all_resources',
    name: 'Ressourcen-Master',
    desc: 'Schalte alle Ressourcen frei',
    category: 'sammler',
    icon: '👑',
    checkFn: (game) => {
      const resources = Object.values(game.resources);
      return resources.every(r => r.unlocked);
    },
    rewardFn: (game) => {
      for (let key in game.resources) {
        game.resources[key].rps *= 1.1;
        game.resources[key].rpc *= 1.1;
      }
    }
  }),

  // ========== KLICKER ==========

  new Achievement({
    id: 'clicks_100',
    name: 'Fleißiger Klicker',
    desc: 'Klicke 100 mal',
    category: 'klicker',
    icon: '👆',
    checkFn: (game) => (game.totalClicks || 0) >= 100,
    progressFn: (game) => game.totalClicks || 0,
    maxProgress: 100
  }),

  new Achievement({
    id: 'clicks_1000',
    name: 'Klick-Enthusiast',
    desc: 'Klicke 1.000 mal',
    category: 'klicker',
    icon: '✋',
    checkFn: (game) => (game.totalClicks || 0) >= 1000,
    progressFn: (game) => game.totalClicks || 0,
    maxProgress: 1000,
    rewardFn: (game) => {
      game.getResource('stein').rpc += 2;
    }
  }),

  new Achievement({
    id: 'clicks_10k',
    name: 'Klick-Meister',
    desc: 'Klicke 10.000 mal',
    category: 'klicker',
    icon: '🖱️',
    checkFn: (game) => (game.totalClicks || 0) >= 10_000,
    progressFn: (game) => game.totalClicks || 0,
    maxProgress: 10_000,
    rewardFn: (game) => {
      for (let key in game.resources) {
        game.resources[key].rpc *= 1.05;
      }
    }
  }),

  // ========== UPGRADE ==========

  new Achievement({
    id: 'first_upgrade',
    name: 'Erste Verbesserung',
    desc: 'Kaufe dein erstes Upgrade',
    category: 'upgrade',
    icon: '⬆️',
    checkFn: (game) => game.upgrades.some(u => u.level > 0)
  }),

  new Achievement({
    id: 'upgrades_10',
    name: 'Upgrade-Sammler',
    desc: 'Kaufe 10 Upgrades',
    category: 'upgrade',
    icon: '📈',
    checkFn: (game) => {
      const totalLevels = game.upgrades.reduce((sum, u) => sum + u.level, 0);
      return totalLevels >= 10;
    },
    progressFn: (game) => game.upgrades.reduce((sum, u) => sum + u.level, 0),
    maxProgress: 10
  }),

  new Achievement({
    id: 'upgrades_50',
    name: 'Upgrade-Meister',
    desc: 'Kaufe 50 Upgrades',
    category: 'upgrade',
    icon: '📊',
    checkFn: (game) => {
      const totalLevels = game.upgrades.reduce((sum, u) => sum + u.level, 0);
      return totalLevels >= 50;
    },
    progressFn: (game) => game.upgrades.reduce((sum, u) => sum + u.level, 0),
    maxProgress: 50,
    rewardFn: (game) => {
      game.upgrades.forEach(u => u.costMult *= 0.95);
    }
  }),

  new Achievement({
    id: 'max_upgrade',
    name: 'Maximum Power',
    desc: 'Bringe ein Upgrade auf Stufe 100',
    category: 'upgrade',
    icon: '💯',
    checkFn: (game) => game.upgrades.some(u => u.level >= 100),
    hidden: true
  }),

  // ========== PRESTIGE ==========

  new Achievement({
    id: 'first_prestige',
    name: 'Neuanfang',
    desc: 'Führe dein erstes Prestige durch (Prestige gibt dir dauerhafte Bonuspunkte für schnellere Runs.)',
    category: 'prestige',
    icon: '🌟',
    checkFn: (game) => (game.prestigeCount || 0) >= 1
  }),

  new Achievement({
    id: 'prestige_5',
    name: 'Prestige-Veteran',
    desc: 'Führe 5 Prestiges durch',
    category: 'prestige',
    icon: '⭐',
    checkFn: (game) => (game.prestigeCount || 0) >= 5,
    progressFn: (game) => game.prestigeCount || 0,
    maxProgress: 5,
    rewardFn: (game) => {
      game.achievementPrestigeBonus = (game.achievementPrestigeBonus || 1) * 1.1;
    }
  }),

  new Achievement({
    id: 'prestige_25',
    name: 'Prestige-Legende',
    desc: 'Führe 25 Prestiges durch',
    category: 'prestige',
    icon: '✨',
    checkFn: (game) => (game.prestigeCount || 0) >= 25,
    progressFn: (game) => game.prestigeCount || 0,
    maxProgress: 25,
    rewardFn: (game) => {
      game.achievementPrestigeBonus = (game.achievementPrestigeBonus || 1) * 1.25;
    }
  }),

  // ========== FORSCHUNG ==========

  new Achievement({
    id: 'first_research',
    name: 'Forscher',
    desc: 'Kaufe deine erste Forschung (Forschung verstärkt deine Klicks basierend auf deiner aktuellen Produktion.)',
    category: 'forschung',
    icon: '🔬',
    checkFn: (game) => game.upgrades.some(u => u.research && u.level > 0)
  }),

  new Achievement({
    id: 'all_research',
    name: 'Wissenschaftler',
    desc: 'Kaufe alle Forschungen',
    category: 'forschung',
    icon: '🧪',
    checkFn: (game) => {
      const research = game.upgrades.filter(u => u.research);
      return research.every(r => r.level > 0);
    },
    rewardFn: (game) => {
      for (let key in game.resources) {
        game.resources[key].rps *= 1.15;
        game.resources[key].rpc *= 1.15;
      }
    }
  }),

  // ========== SPEZIAL ==========

  new Achievement({
    id: 'speed_demon',
    name: 'Geschwindigkeitsdämon',
    desc: 'Erreiche 1000 Stein in unter 5 Minuten',
    category: 'spezial',
    icon: '⚡',
    checkFn: (game) => {
      const playTime = (Date.now() - (game.startTime || Date.now())) / 1000;
      return game.getResource('stein').amount >= 1000 && playTime < 300;
    },
    hidden: true
  }),

  new Achievement({
    id: 'patient',
    name: 'Geduld ist eine Tugend',
    desc: 'Spiele 1 Stunde lang',
    category: 'spezial',
    icon: '⏳',
    checkFn: (game) => {
      const playTime = (Date.now() - (game.startTime || Date.now())) / 1000;
      return playTime >= 3600;
    },
    progressFn: (game) => (Date.now() - (game.startTime || Date.now())) / 1000,
    maxProgress: 3600
  }),

  new Achievement({
    id: 'hoarder',
    name: 'Hamsterer',
    desc: 'Habe gleichzeitig 1M von jeder Ressource',
    category: 'spezial',
    icon: '🏦',
    checkFn: (game) => {
      return Object.values(game.resources).every(r => r.amount >= 1_000_000);
    },
    hidden: true
  })
];

export default achievementsList;
