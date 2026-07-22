import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(readFileSync(resolve(repositoryRoot, relativePath), 'utf8'));
const config = readJson('ui/data/release-config.json');

if (!Number.isInteger(config.major) || config.major < 1) {
  throw new Error('release-config.json must contain a positive integer "major" value.');
}

const tagPattern = `v${config.major}.*`;
const tags = execFileSync('git', ['tag', '--list', tagPattern], { cwd: repositoryRoot, encoding: 'utf8' })
  .trim()
  .split(/\s+/)
  .filter(Boolean);
const tagExpression = new RegExp(`^v${config.major}\\.(\\d+)$`);
const latestMinor = tags.reduce((highest, tag) => {
  const match = tag.match(tagExpression);
  return match ? Math.max(highest, Number(match[1])) : highest;
}, -1);
const version = `${config.major}.${latestMinor + 1}`;
const tag = `v${version}`;
const releaseInfo = {
  product: config.product,
  version,
  releaseDate: new Date().toISOString(),
  builtBy: config.builtBy,
  description: config.description
};

writeFileSync(resolve(repositoryRoot, 'ui/data/app-info.json'), `${JSON.stringify(releaseInfo, null, 2)}\n`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ntag=${tag}\n`);
}

console.log(`Generated About metadata for ${tag}.`);
