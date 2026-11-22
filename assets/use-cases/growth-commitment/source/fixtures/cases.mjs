// Complete, fictional native-app cases. The workflow walkthrough uses the same
// business facts through its shared inputs; these cases exercise the model on
// its own, without workflow adapters or presentation code.
import { makeCase } from '../model.mjs';

export function growthCases() {
  const base = makeCase();
  const changed = (id, change) => { const input = structuredClone(base); input.id = id; change(input); return input; };
  const allGrowthBlocked = changed('all-growth-blocked', input => { input.parameters.openingCashMinor = 100000; });
  const weakDemand = changed('weak-demand', input => {
    const weak = input.tables.outcomes.map(row => ({ ...row, scenario: 'weak-demand', customers: row.arrangement === 'baseline' ? 0 : row.arrangement === 'large-invoice' ? 10 : row.arrangement === 'small-invoice' ? 2 : 3 }));
    input.tables.scenarios.push({ id: 'weak-demand', label: 'Weak demand after campaign expense is committed' });
    input.tables.outcomes.push(...weak);
  });
  const zeroSales = changed('zero-sales', input => { input.tables.outcomes.forEach(row => { row.customers = 0; }); });
  const lateCollection = changed('late-collection', input => { input.tables.outcomes.find(row => row.arrangement === 'small-invoice').customerReceiptDay = 61; });
  const latePrepayment = changed('late-prepayment', input => { input.tables.outcomes.find(row => row.arrangement === 'medium-prepay').customerReceiptDay = 15; });
  const capacityShortage = changed('capacity-shortage', input => { input.tables.capacityPeriods[0].availableHours = 40; });
  const protectedReserve = changed('protected-reserve', input => { input.parameters.minimumReserveMinor = 900000; });
  const missedCutoff = changed('missed-cutoff', input => { input.parameters.currentDay = 4; });
  const zeroContribution = changed('zero-contribution', input => { input.parameters.unitPriceMinor = input.parameters.deliveryExpensePerCustomerMinor; });
  const missingForecast = changed('missing-forecast', input => { delete input.tables.outcomes[2].customers; });
  return { baseline: base, 'all-growth-blocked': allGrowthBlocked, 'weak-demand': weakDemand, 'zero-sales': zeroSales, 'late-collection': lateCollection, 'late-prepayment': latePrepayment, 'capacity-shortage': capacityShortage, 'protected-reserve': protectedReserve, 'missed-cutoff': missedCutoff, 'zero-contribution': zeroContribution, 'missing-forecast': missingForecast };
}
