import Upgrade from "./upgrade.js";

const researchUpgradesList = [
  new Upgrade({
    id: "stein_research_rpc",
    name: "Stein-Forschung",
    desc: "Erhöht Stein pro Klick um 25% deiner aktuellen Stein-pro-Sekunde-Rate.",
    costRes: "stein",
    costBase: 200,
    costMult: 1.5,
    apply: (game) => {
      const r = game.getResource("stein");
      r.rpc += r.rps * 0.25;
    },
    research: true
  }),
  new Upgrade({
   id: "holz_research_rpc",
   name: "Holz-Forschung",
   desc: "Erhöht Holz pro Klick um 25% deiner aktuellen Holz-pro-Sekunde-Rate.",
   costRes: "holz",
   costBase: 500,
   costMult: 1.6,
   apply: (game) => {
     const r = game.getResource("holz");
     r.rpc += r.rps * 0.25;
   },
   research: true
  }),
  new Upgrade({
    id: "ton_research_rpc",
    name: "Ton-Forschung",
    desc: "Erhöht Ton pro Klick um 20% deiner aktuellen Ton-pro-Sekunde-Rate.",
    costRes: "ton",
    costBase: 1000,
    costMult: 1.7,
    apply: (game) => {
      const r = game.getResource("ton");
      r.rpc += r.rps * 0.20;
    },
    research: true
  }),
  new Upgrade({
    id: "metall_research_rpc",
    name: "Metall-Forschung",
    desc: "Erhöht Metall pro Klick um 15% deiner aktuellen Metall-pro-Sekunde-Rate.",
    costRes: "metall",
    costBase: 5000,
    costMult: 1.8,
    apply: (game) => {
      const r = game.getResource("metall");
      r.rpc += r.rps * 0.15;
    },
    research: true
  }),
  new Upgrade({
    id: "kristall_research_rpc",
    name: "Kristall-Forschung",
    desc: "Erhöht Kristall pro Klick um 10% deiner aktuellen Kristall-pro-Sekunde-Rate.",
    costRes: "kristall",
    costBase: 10000,
    costMult: 1.9,
    apply: (game) => {
      const r = game.getResource("kristall");
      r.rpc += r.rps * 0.10;
    },
    research: true
  })
  ];

export default researchUpgradesList;
