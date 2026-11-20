const { readFileSync } = require('node:fs');

module.exports = {
  cli: {
    code: readFileSync('assets/products/shipment-cli.sh', 'utf8').trimEnd(),
  },
  sdk: {
    code: readFileSync('assets/products/run-shipment.mjs', 'utf8').trimEnd(),
  },
};
