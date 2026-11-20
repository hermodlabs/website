import { readFile, writeFile } from 'node:fs/promises';
import { createDecisionLab } from '@decision-lab/sdk';
import { createNodeExecutor } from '@decision-lab/sdk/node';

const executor = createNodeExecutor();
const lab = createDecisionLab({ executor });

try {
  const app = lab.apps.open(
    await readFile('shipment.app.json', 'utf8')
  );
  const inputs = lab.sources.parseCase(
    await readFile('shipment.case.yaml', 'utf8')
  );

  const { report } = await lab.run({ app, case: inputs });

  await writeFile(
    'shipment.report.json',
    lab.sources.renderJSON(report)
  );
} finally {
  await executor.close();
}
