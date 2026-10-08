const args = process.argv.slice(2);
const idx = args.indexOf('-p');
const prompt = idx >= 0 ? args[idx + 1] : '';

if (prompt === 'ERROR_TEST') {
  console.error('boom');
  process.exit(1);
}

if (prompt === 'ARGS_TEST') {
  console.log(args.slice(0, idx).join(' '));
  process.exit(0);
}

console.log(`echo:${prompt}`);
