const args = process.argv.slice(2);
const idx = args.indexOf('-p');
let promptIdx = idx >= 0 ? idx + 1 : -1;
if (args[promptIdx] === '--') promptIdx += 1;
const prompt = promptIdx >= 0 ? args[promptIdx] : '';

if (prompt === 'ERROR_TEST') {
  console.error('boom');
  process.exit(1);
}

console.log(`echo:${prompt}`);
