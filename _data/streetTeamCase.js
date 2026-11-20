const { readFileSync } = require('node:fs');
const { join } = require('node:path');

module.exports = () => JSON.parse(readFileSync(
  join(__dirname, '../../assets/use-cases/street-team-deployment/worked-case.json'), 'utf8'
));
