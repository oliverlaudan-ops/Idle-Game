/* ==========================================================
   From Stone to Civilization – game.js (Dynamic Clean Build)
   ========================================================== */

/* ------------------ Utils ------------------ */
const SAVEKEY = 'stone_idle_save_dyn_v1';

const fmt = n => {
  if (n == null) return '0';
  const abs = Math.abs(n);
  if (abs < 1000) return (Math.round(n * 100) / 100).toString();
  const units = ['K','M','B','T','Qa','Qi'];
  let u = -1, x = abs;
  while (x >= 1000 && u < units.length - 1) { x /= 1000; u++; }
  return (n < 0 ? '-' : '') + x.toFixed(2) + units[u];
};
const clamp0 = v => (v < 0 ? 0 : v);
const getEl = id => document.getElementById(id);

/* ------------------ DEFAULT Game State ------------------ */
const DEFAULT = {
  tickMs: 1000,
  ep: 0,
  prestigeTimes: 0,
  owned: {},
  unlocks: {},
  effMult: 1,            // Global Efficiency Multiplier (Ofen)
  // Resources (initial values)
  stein: 0,
  holz: 0,
  metall: 0,
  rpcStein: 1,
  rpcHolz: 0,
  rpcMetall: 0,
  rpsStein: 0,
  rpsHolz: 0,
  rpsMetall: 0,
  // Unlocks
  unlStein: true,        // Stein ist von Anfang an freigeschaltet
  unlHolz: false,
  unlMetall: false,
};

/* ------------------ Dynamic Resources ------------------ */
const RESOURCES = [
  { key: 'stein',  icon: '🪨', label: 'Stein',  unlockedBy: null,  startRpc: 1 },
  { key: 'holz',   icon: '🌲', label: 'Holz',   unlockedBy: 'werkbank', startRpc: 1 },
  { key: 'metall', icon: '⛏️', label: 'Metall', unlockedBy: 'schmiede', startRpc: 1 },
];

const state = { ...DEFAULT };  // Hier wird DEFAULT korrekt angewendet.

RESOURCES.forEach(r => {
  state[r.key] = 0;
  state['rpc_' + r.key] = r.startRpc || 0;
  state['rps_' + r.key] = 0;
  state['unl_' + r.key] = !r.unlockedBy; // Standard: frei, wenn kein Unlock
});

/* ------------------ Upgrades ------------------ */
upgrades.push({
  id: 'ofen',
  res: 'holz',
  requiresUnlock: 'holz',
  name: 'Ofen',
  desc: 'Effizienz +10% global',
  baseCost: 1500,     // Startkosten
  mult: 1.35,         // Kosten-Skalierung pro Kauf
  apply: s => {
    s.effMult = +(s.effMult * 1.10).toFixed(6);   // sauber runden
  }
});

// Restlicher Code für die Upgrades
