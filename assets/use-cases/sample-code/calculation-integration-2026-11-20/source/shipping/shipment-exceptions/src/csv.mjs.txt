/**
 * Small, strict CSV reader for the company's flat exports. Quoted commas,
 * escaped quotes, CRLF and quoted newlines are supported. Malformed rows are
 * errors: silently shifting a column could turn a quote into the wrong price.
 */
export class CsvError extends Error {
  constructor(message, { source = 'CSV', line = 1 } = {}) {
    super(`${source}:${line}: ${message}`);
    this.name = 'CsvError';
    this.source = source;
    this.line = line;
  }
}

export function parseCsv(text, { source = 'CSV' } = {}) {
  if (typeof text !== 'string') throw new TypeError('CSV input must be a string.');
  if (text.startsWith('\uFEFF')) text = text.slice(1);
  if (text.includes('\0')) throw new CsvError('NUL characters are not permitted.', { source });
  const records = [];
  let cells = [], cell = '', quoted = false, afterQuote = false, line = 1, rowLine = 1;
  let hasRecord = false;
  const fail = message => { throw new CsvError(message, { source, line }); };
  const finishCell = () => { cells.push(cell); cell = ''; afterQuote = false; };
  const finishRow = () => {
    finishCell();
    records.push({ cells, line: rowLine });
    cells = []; hasRecord = false;
  };
  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    if (quoted) {
      if (character === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; }
        else { quoted = false; afterQuote = true; }
      } else {
        cell += character;
        if (character === '\n') line += 1;
        else if (character === '\r' && text[i + 1] !== '\n') fail('Use CRLF or LF line endings.');
      }
      continue;
    }
    if (character === ',') { finishCell(); hasRecord = true; continue; }
    if (character === '\n' || character === '\r') {
      if (character === '\r') {
        if (text[i + 1] !== '\n') fail('Use CRLF or LF line endings.');
        i += 1;
      }
      finishRow(); line += 1; rowLine = line; continue;
    }
    if (afterQuote) fail('Only a comma or line ending may follow a closing quote.');
    if (character === '"') {
      if (cell.length > 0) fail('A quote may only begin an empty field.');
      quoted = true; hasRecord = true; continue;
    }
    cell += character; hasRecord = true;
  }
  if (quoted) fail('Unterminated quoted field.');
  if (hasRecord || cells.length || cell.length || afterQuote) finishRow();
  if (!records.length) throw new CsvError('A header row is required.', { source });
  const headers = records.shift().cells;
  const seen = new Set();
  for (const header of headers) {
    if (!header || header.trim() !== header) throw new CsvError('Column names must be nonempty and have no surrounding whitespace.', { source });
    if (seen.has(header)) throw new CsvError(`Duplicate column ${JSON.stringify(header)}.`, { source });
    seen.add(header);
  }
  const rows = records.map(record => {
    if (record.cells.length !== headers.length) throw new CsvError(`Expected ${headers.length} columns; received ${record.cells.length}.`, { source, line: record.line });
    return { line: record.line, values: Object.fromEntries(headers.map((header, index) => [header, record.cells[index]])) };
  });
  return { headers, rows };
}
