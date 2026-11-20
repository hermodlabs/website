const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');

module.exports = () => {
  const directory = join(__dirname, '../../assets/use-cases/street-team-deployment');
  const readJSON = file => JSON.parse(readFileSync(join(directory, file), 'utf8'));
  const model = readJSON('decision-map.json');
  const context = model.contexts.find(item => item.id === model.defaultContextId);
  const nodes = new Map(model.nodes.map(item => [item.id, item]));
  const operatingSource = 'marketplace/article.run.json';
  const financialSource = 'cli/retained/decision/complete.output.json';
  const current = readJSON(operatingSource);
  const evaluation = current.evaluations.find(item => item.id === context.source.evaluationId);
  const financialBrief = readJSON(financialSource).brief;
  const thresholds = financialBrief.sections.find(item => item.id === 'guest-thresholds').value;
  const sectionOptions = financialBrief.sections.find(item => item.id === 'operating-options').value;
  assert.equal(evaluation.output.coverage.complete, true);
  assert.equal(evaluation.run.assessment.status, 'complete');
  const proposal = current.case.promotion.proposal;
  const acceptedChoice = current.answers.proposal.status === 'accepted'
    && proposal.evaluationId === evaluation.id
    && current.reviews.some(item => item.evaluationId === evaluation.id && item.status === 'accepted');

  // Copy native findings; do not reimplement coverage or financial thresholds.
  // The retained financial brief has the same financial inputs as this case.
  const rows = ['hold', 'small-standard', 'large-standard', 'large-discount'].map(id => {
    const option = evaluation.inputs.tables.options.find(item => item.id === id);
    const operating = evaluation.output.plans.find(item => item.deployment === id);
    const financial = thresholds.find(item => item.deployment === id);
    const financialOperating = sectionOptions.find(item => item.deployment === id);
    const coverage = model.coverageRecords.find(item => item.contextId === context.id
      && item.evidence.some(source => source.deploymentId === id));
    assert.equal(option.expenseMinor, operating.expenseMinor);
    assert.equal(financial.expenseMinor, operating.expenseMinor);
    assert.equal(financial.feasible, operating.feasible);
    assert.equal(financialOperating.expenseMinor, operating.expenseMinor);
    assert.equal(financialOperating.insideStaff, operating.insideStaff);
    assert.equal(financialOperating.feasible, operating.feasible);
    assert.equal(coverage.insideStaff, operating.insideStaff);
    if (id === 'hold') {
      assert.equal(financial.status, 'not-applicable');
      assert.equal(financial.contributionMinor, null);
      assert.equal(financial.breakEvenGuests, null);
    } else {
      assert.equal(financial.contributionMinor, current.case.promotion.contribution[id]);
      assert.equal(financial.existingCustomerDiscountLossMinor, current.case.promotion.discountLoss[id]);
      assert.equal(financial.status, 'calculated');
    }
    return {
      id,
      label: option.label,
      outreachStaff: option.promoters,
      insideStaff: operating.insideStaff,
      coveragePassed: coverage.meetsMinimum,
      coverageLabel: coverage.meetsMinimum ? 'Meets floor minimum' : 'Below floor minimum',
      costUSD: operating.expenseMinor / 100,
      contributionUSD: financial.contributionMinor === null ? null : financial.contributionMinor / 100,
      existingGuestLossUSD: financial.existingCustomerDiscountLossMinor === null
        ? null : financial.existingCustomerDiscountLossMinor / 100,
      breakEvenGuests: financial.breakEvenGuests,
      operatingFeasible: operating.feasible,
      operatingLabel: operating.feasible ? 'Meets recorded conditions' : 'Blocked: floor coverage',
      isCurrentChoice: acceptedChoice && proposal.deployment === id,
    };
  });
  assert.ok(rows.filter(row => row.id !== 'hold').every(row => row.existingGuestLossUSD === 0));
  return {
    ...model,
    context,
    basisMatrix: {
      contextId: context.id,
      contextLabel: context.label,
      qualifiedStaff: context.qualifiedStaff,
      unavailableStaff: context.unavailableStaff,
      availableStaff: context.availableStaff,
      minimumInside: context.minimumInside,
      expenseLimitUSD: evaluation.inputs.parameters.expenseLimitMinor / 100,
      existingGuestLossUSD: 0,
      currency: 'USD',
      responseLabel: 'Customer response unknown',
      profitLabel: 'Profit not established',
      thresholdMeaning: 'Additional guests needed to cover the commitment under the recorded contribution assumptions; not expected attendance or profit achieved.',
      source: {
        operatingFile: operatingSource,
        evaluationId: evaluation.id,
        operatingOutputPointer: `${context.source.evaluationPointer}/output`,
        financialFile: financialSource,
        financialSectionId: 'guest-thresholds',
        financialQualification: 'Retained native financial brief, with expense, contribution and discount-loss inputs matched to the current Marketplace case.',
      },
      rows,
    },
    outcomes: model.display.alternativeIds.map(id => ({
      ...model.coverageRecords.find(record => record.contextId === context.id && record.alternativeId === id),
      label: nodes.get(id).label,
    })),
  };
};
