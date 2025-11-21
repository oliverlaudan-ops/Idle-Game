// resources-def.js
import { Resource } from './resource.js';

// Alle Ressourcen als Array definieren
const resourcesList = [
  new Resource('stein', 'Stein', '🪨', 1, 0, true),      // Startressource
  new Resource('holz',  'Holz',  '🌲', 0, 0, false),     // Wird freigeschaltet
  new Resource('metall','Metall','⛏️', 0, 0, false),    // Wird freigeschaltet
  new Resource('kristall','Kristall','💎', 0, 0, false)  // Wird freigeschaltet
  // Hier kannst du beliebig neue Ressourcen ergänzen:
  // new Resource('kupfer', 'Kupfer', '🪙', 0, 0, false)
];

export default resourcesList;
