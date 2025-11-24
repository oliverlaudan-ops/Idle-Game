// upgrades-def.js

import { Upgrade } from './upgrade.js';

// Achtung: Passe Ressourcen/IDs ggf. an deine Resource-Objekte in game.js an!
const upgradesList = [
  new Upgrade({
    id:'faustkeil',
    name:'Faustkeil',
    desc:'+1 Stein pro Klick',
    costRes:'stein',
    costBase:10,
    costMult:1.25,
    apply:(game)=>{
      game.getResource('stein').rpc += 1;
    }
  }),
  new Upgrade({
    id:'steinspalter',
    name:'Steinspalter',
    desc:'+0.2 Stein / Sekunde',
    costRes:'stein',
    costBase:30,
    costMult:1.30,
    apply:(game)=>{
      game.getResource('stein').rps += 0.2;
    }
  }),
  new Upgrade({
    id:'steinmine',
    name:'Steinmine',
    desc:'+5 Stein / Sekunde',
    costRes:'stein',
    costBase:120,
    costMult:1.35,
    apply:(game)=>{
      game.getResource('stein').rps += 5;
    }
  }),
  new Upgrade({
    id:'bergwerk',
    name:'Bergwerk',
    desc:'+20 Stein / Sekunde',
    costRes:'stein',
    costBase:1000,
    costMult:1.5,
    apply:(game)=>{
      game.getResource('stein').rps += 20;
    }
  }),
  // Stein Multiplikator
  new Upgrade({
    id: 'stein_multiplikator',
    name: 'Effizienzverbesserung',
    desc: 'Erhöht STEIN Produktionsrate um 1.5x',
    costRes: 'stein',
    costBase: 10000,
    costMult: 1.5,
    single: true,
    apply: (game) => {
      game.getResource('stein').rpc *= 1.5;
      game.getResource('stein').rps *= 1.5;
    }
  }),
  // Holz-Upgradekette
  new Upgrade({
    id:'werkbank',
    name:'Werkbank',
    desc:'Schaltet HOLZ frei',
    costRes:'stein',
    costBase:80,
    costMult:2.0,
    single:true,
    unlocksResourceId:'holz',
    apply:(game)=>{
      const holz = game.getResource('holz');
      holz.rpc = Math.max(holz.rpc,1);
    }
  }),
  new Upgrade({
    id:'axt',
    name:'Axt',
    desc:'+1 Holz pro Klick',
    costRes:'holz',
    costBase:50,
    costMult:1.30,
    apply:(game)=>{
      game.getResource('holz').rpc += 1;
    }
  }),
  new Upgrade({
    id:'holzfaeller',
    name:'Holzfäller',
    desc:'+0.8 Holz / Sekunde',
    costRes:'holz',
    costBase:120,
    costMult:1.30,
    apply:(game)=>{
      game.getResource('holz').rps += 0.8;
    }
  }),
  new Upgrade({
    id:'saegewerk',
    name:'Sägewerk',
    desc:'+5 Holz / Sekunde',
    costRes:'holz',
    costBase:500,
    costMult:1.4,
    apply:(game)=>{
      game.getResource('holz').rps += 5;
    }
  }),
  new Upgrade({
    id:'tischlerei',
    name:'Tischlerei',
    desc:'+20 Holz / Sekunde',
    costRes:'holz',
    costBase:4500,
    costMult:1.5,
    apply:(game)=>{
      game.getResource('holz').rps += 20;
    }
  }),
  // Holz Multiplikator
  new Upgrade({
    id: 'holz_multiplikator',
    name: 'Effizienzverbesserung',
    desc: 'Erhöht HOLZ Produktionsrate um 1.5x',
    costRes: 'holz',
    costBase: 10000,
    costMult: 1.5,
    single: true,
    apply: (game) => {
      game.getResource('holz').rpc *= 1.5;
      game.getResource('holz').rps *= 1.5;
    }
  }),
  // Ton Upgrades
  new Upgrade({
    id:'toepferei',
    name:'Töpferei',
    desc:'Schaltet TON frei',
    costRes:'stein',
    costBase:600,
    costMult:1.8,
    single:true,
    unlocksResourceId:'ton',
    apply:(game)=>{
      const res = game.getResource('ton');
      res.rpc = Math.max(res.rpc,1);
    }
  }),
  new Upgrade({
    id:'lehmgrube',
    name:'Lehmgrube',
    desc:'+1 Ton pro Klick',
    costRes:'ton',
    costBase:200,
    costMult:1.20,
    apply:(game)=>{
      game.getResource('ton').rpc += 1;
    }
  }),
  new Upgrade({
    id:'ziegelei',
    name:'Ziegelei',
    desc:'+2 Ton / Sekunde',
    costRes:'ton',
    costBase:1500,
    costMult:1.35,
    apply:(game)=>{
      game.getResource('ton').rps += 2;
    }
  }),
  new Upgrade({
    id:'ton_manufaktur',
    name:'Ton-Manufaktur',
    desc:'+10 Ton / Sekunde',
    costRes:'ton',
    costBase:1750,
    costMult:1.4,
    apply:(game)=>{
      game.getResource('ton').rps += 10;
    }
  }),
  new Upgrade({
    id:'ziegel_fabrik',
    name:'Ziegel-Fabrik',
    desc:'+50 Ton / Sekunde',
    costRes:'ton',
    costBase:15000,
    costMult:1.5,
    apply:(game)=>{
      game.getResource('ton').rps += 50;
    }
  }),
  // Ton Multiplikator
  new Upgrade({
    id: 'ton_multiplikator',
    name: 'Effizienzverbesserung',
    desc: 'Erhöht TON Produktionsrate um 1.5x',
    costRes: 'ton',
    costBase: 7500,
    costMult: 1.5,
    single: true,
    apply: (game) => {
      game.getResource('ton').rpc *= 1.5;
      game.getResource('ton').rps *= 1.5;
    }
  }),
  // ...weitere Ton-Upgrades...
  // Metall freischalten & verbessern
  new Upgrade({
    id:'schmiede',
    name:'Schmiede',
    desc:'Schaltet METALL frei',
    costRes:'holz',
    costBase:420,
    costMult:2.1,
    single:true,
    unlocksResourceId:'metall',
    apply:(game)=>{
      const m = game.getResource('metall');
      m.rpc = Math.max(m.rpc,1);
    }
  }),
  new Upgrade({
    id:'eisernePicke',
    name:'Eiserne Picke',
    desc:'+1 Metall pro Klick',
    costRes:'metall',
    costBase:200,
    costMult:1.30,
    apply:(game)=>{
      game.getResource('metall').rpc += 1;
    }
  }),
  new Upgrade({
    id:'schmelzofen',
    name:'Schmelzofen',
    desc:'+1.5 Metall / Sekunde',
    costRes:'metall',
    costBase:600,
    costMult:1.35,
    apply:(game)=>{
      game.getResource('metall').rps += 1.5;
    }
  }),
  new Upgrade({
    id:'giesserei',
    name:'Gießerei',
    desc:'+5 Metall / Sekunde',
    costRes:'metall',
    costBase:1500,
    costMult:1.5,
    apply:(game)=>{
      game.getResource('metall').rps += 5;
    }
  }),
  // Kristall freischalten & verbessern
  new Upgrade({
    id:'kristallberg',
    name:'Kristall-Bergwerk',
    desc:'Schaltet KRISTALL frei',
    costRes:'metall',
    costBase:920,
    costMult:2.1,
    single:true,
    unlocksResourceId:'kristall',
    apply:(game)=>{
      const m = game.getResource('kristall');
      m.rpc = Math.max(m.rpc,1);
    }
  }),
  new Upgrade({
    id:'kristallmine',
    name:'Kristall-Mine',
    desc:'+1 Kristall pro Klick',
    costRes:'kristall',
    costBase:500,
    costMult:1.45,
    apply:(game)=>{
      game.getResource('kristall').rpc += 1;
    }
  }),
  new Upgrade({
    id:'kristallarbeiter',
    name:'Kristall-Arbeiter',
    desc:'+0.15 Kristall / Sekunde',
    costRes:'kristall',
    costBase:1500,
    costMult:1.5,
    apply:(game)=>{
      game.getResource('kristall').rps += 0.15;
    }
  }),
  new Upgrade({
    id:'kristallbagger',
    name:'Kristall-Bagger',
    desc:'+15 Kristall / Sekunde',
    costRes:'kristall',
    costBase:4500,
    costMult:2,
    apply:(game)=>{
      game.getResource('kristall').rps += 15;
    }
  })
];

export default upgradesList;

