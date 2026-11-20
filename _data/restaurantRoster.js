const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');

module.exports = () => {
  const base = join(__dirname, '../../assets/use-cases/restaurant-roster-repair');
  const read = file => JSON.parse(readFileSync(join(base, file), 'utf8'));
  const story = read('story-data.json');
  const { figures } = read('figures.json');
  const full = story.scenarios['full-availability'];
  const short = story.scenarios['short-availability'];
  const stability = story.scenarios['stability-first'];
  const cost = story.scenarios['cost-first'];
  assert.equal(story.fictional, true);
  assert.equal(story.manager, 'Elena');
  for (const scenario of [full, short, stability, cost]) {
    assert.equal(scenario.complete, true);
    assert.equal(scenario.evaluatedCandidates, 4);
  }
  assert.deepEqual(full.repairs.filter(row => row.feasible).map(row => row.id), ['relief', 'coupled']);
  assert.deepEqual(short.repairs.filter(row => row.feasible).map(row => row.id), ['coupled']);
  assert.equal(full.preferredRepairId, null);
  assert.equal(short.preferredRepairId, null);
  assert.equal(stability.preferredRepairId, 'relief');
  assert.equal(cost.preferredRepairId, 'coupled');
  const money = amount => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(amount / 100);
  const rows = full.repairs.map(row => ({
    ...row,
    expense: money(row.expenseMinor),
    additionalExpense: money(row.additionalExpenseMinor),
    finding: row.feasible ? 'Meets requirements' : row.primaryBlocker,
  }));
  const relief = rows.find(row => row.id === 'relief'), coupled = rows.find(row => row.id === 'coupled');
  // These amounts and counts are quoted in the authored story and its opening brief.
  assert.equal(story.baselineExpenseMinor, 65600);
  assert.equal(story.remainingLaborBudgetMinor, 85600);
  assert.equal(relief.additionalExpenseMinor, 18000);
  assert.equal(relief.changedAssignments, 1);
  assert.equal(coupled.additionalExpenseMinor, 8000);
  assert.equal(coupled.changedAssignments, 3);
  const prefix = '/assets/use-cases/restaurant-roster-repair/';
  return {
    matrix: rows,
    feasibleRepairs: rows.filter(row => row.feasible),
    timeline: {
      id:'restaurant-roster-timeline', image:prefix+'roster-timeline.svg', width:960, height:760,
      mobileImage:prefix+'roster-timeline-mobile.svg', mobileWidth:360, mobileHeight:1220,
      alt:'Three affected published positions: Saturday cook Nora is replaced by Rowan or Theo. If Theo moves to Saturday, Ben covers Sunday cooking and Ava covers Ben’s Sunday serving position. The other six recorded positions are unchanged.',
      caption:'Follow the three affected positions through Saturday and Sunday. Each repair also retains the other six recorded positions; the calculation checks the complete remaining roster.',
    },
    interests: {
      id:'restaurant-roster-interests', image:prefix+'interests.svg', width:960, height:720,
      mobileImage:prefix+'interests-mobile.svg', mobileWidth:360, mobileHeight:1220,
      alt:'Employee availability and predictable assignments, kitchen and service coverage, the owner’s expense boundary and calculated findings inform Elena’s roster proposal. People confirm and communicate changes outside the calculation.',
      caption:'Recorded requirements constrain Elena’s proposal. Predictable assignments are an interest that can inform a preference; actual availability remains mandatory. The report supports the choice and does not publish a roster.',
    },
    comparisons: {
      availability: {
        id:'restaurant-roster-availability', kind:'context', title:'The same repairs. A different availability window.',
        sharedBasis:'The same four complete repairs, qualifications, other availability, earlier work, flat fees and $856 remaining-payroll limit. The first calculation identifies feasible alternatives without ranking them.',
        change:'Only Rowan’s recorded Saturday availability ends earlier: 8 p.m. instead of 10 p.m. The proposed dinner assignment remains 6–10 p.m. Case identity labels the two calculations.',
        panels:[
          {label:'Rowan can stay until 10 p.m.',finding:'Two supplied repairs meet the requirements.',inputs:[{label:'Rowan’s availability',value:'6–10 p.m.'},{label:'Feasible supplied repairs',value:'2 of 4'},{label:'Authored preference',value:'Feasibility only'}],figure:figures.full,explanation:'Elena can consider bringing in Rowan or making the three coordinated changes. This calculation establishes no preferred repair.'},
          {label:'Rowan must leave at 8 p.m.',finding:'The relief repair fails the availability check.',inputs:[{label:'Rowan’s availability',value:'6–8 p.m.'},{label:'Feasible supplied repairs',value:'1 of 4'},{label:'Authored preference',value:'Feasibility only'}],figure:figures.short,explanation:'Elena cannot count Rowan through closing. The coordinated repair remains feasible; another alternative needs to be supplied and assessed before it can enter the comparison.'},
        ],
        takeaway:'The named replacement is the same. The recorded time window changes whether that complete repair meets the requirements; a preference cannot extend someone’s availability.',
      },
      priority: {
        id:'restaurant-roster-priority', kind:'policy', title:'The same feasible repairs. Two explicit priorities.',
        sharedBasis:'Full Rowan availability, the same four complete repairs and all the same mandatory staffing and expense conditions. Two repairs remain feasible in both calculations.',
        change:'Only the authored preference order changes: minimize changed published positions before expense, or minimize expense before changed positions. Separate app identities retain the two profiles.',
        panels:[
          {label:'Preserve published assignments first',finding:'Bring in Rowan is preferred.',inputs:[{label:'First priority',value:'Fewest changed published positions'},{label:'Additional expense',value:relief.additionalExpense},{label:'Changed positions',value:String(relief.changedAssignments)}],figure:figures.stability,explanation:'Elena preserves the other published assignments. The remaining payroll is '+relief.expense+', within the same $856 limit.'},
          {label:'Minimize remaining payroll first',finding:'Repair three assignments is preferred.',inputs:[{label:'First priority',value:'Lowest remaining payroll'},{label:'Additional expense',value:coupled.additionalExpense},{label:'Changed positions',value:String(coupled.changedAssignments)}],figure:figures.cost,explanation:'The coordinated changes retain the required service coverage at '+coupled.expense+' remaining payroll. The additional expense is $100 lower than bringing in Rowan.'},
        ],
        takeaway:'The requirements do not change. The declared priority selects a different preferred repair among the same supplied alternatives. Elena remains responsible for choosing the priority and confirming the changes.',
      },
    },
  };
};
