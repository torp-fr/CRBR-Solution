'use strict';

const Calculator = {
  // Returns { counts, moduleCosts, totalMat, sellPrice, detail }
  compute() {
    const { modules, settings } = AppState;
    const { materials, compositions, business } = settings;
    const matKeys = Object.keys(materials);

    // Count modules per type
    const counts = { wall: 0, window: 0, door: 0, opening: 0 };
    modules.forEach(m => { if (counts[m.type] !== undefined) counts[m.type]++; });

    // Cost per module type
    const moduleCosts = {};
    let totalMat = 0;

    Object.keys(counts).forEach(type => {
      if (counts[type] === 0) { moduleCosts[type] = 0; return; }
      const comp  = compositions[type];
      let unitCost = 0;
      const breakdown = {};

      matKeys.forEach(k => {
        const qty = comp[k] || 0;
        const line = qty * materials[k].price;
        unitCost += line;
        breakdown[k] = { qty, line };
      });

      moduleCosts[type] = {
        unit:  +unitCost.toFixed(2),
        total: +(unitCost * counts[type]).toFixed(2),
        breakdown,
      };
      totalMat += unitCost * counts[type];
    });

    totalMat = +totalMat.toFixed(2);

    const margin       = business.margin / 100;
    const delivery     = business.delivery;
    const installation = business.installation;
    const sellPrice    = +((totalMat * (1 + margin)) + delivery + installation).toFixed(2);
    const marginAmount = +(totalMat * margin).toFixed(2);
    const totalModules = Object.values(counts).reduce((s, v) => s + v, 0);

    return { counts, moduleCosts, totalMat, sellPrice, marginAmount, delivery, installation, totalModules };
  },
};
