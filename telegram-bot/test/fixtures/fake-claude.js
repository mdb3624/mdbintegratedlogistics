const args = process.argv.slice(2);
const idx = args.indexOf('-p');
const prompt = idx >= 0 ? args[idx + 1] : '';

if (prompt === 'ERROR_TEST') {
  console.error('boom');
  process.exit(1);
}

console.log(`echo:${prompt}`);
