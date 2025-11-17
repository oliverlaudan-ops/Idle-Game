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

/* ------------------ Dynamic Resources ------------------ */
const RESOURCES = [
  { key: 'stein',  icon: '🪨', label: 'Stein',  unlockedBy: null,  startRpc: 1 },
  { key: 'holz',   icon: '🌲', label: 'Holz',   unlockedBy: 'werkbank', startRpc: 1 },
  { key: 'metall', icon: '⛏️', label: 'Metall', unlockedBy: 'schmiede', startRpc: 1 },
];

const state = { ...DEFAULT, effMult: 1 };  // State für globale Multiplikatoren und Ressourcen.

RESOURCES.forEach(r => {
  state[r.key] = 0;
  state['rpc_' + r.key] = r.startRpc || 0;
  state['rps_' + r.key] = 0;
  state['unl_' + r.key] = !r.unlockedBy; // Standard: frei, wenn kein Unlock
});

