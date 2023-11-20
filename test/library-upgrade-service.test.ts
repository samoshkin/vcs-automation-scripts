import LibraryUpgradeService from '../src/library-upgrade-service';
import * as tmp from 'tmp-promise';
import * as fs from 'fs/promises';
import type { PackageJson } from 'type-fest';

let service: LibraryUpgradeService;
let tmpFile: tmp.FileResult;

beforeEach(async () => {
  service = new LibraryUpgradeService();
});

afterEach(async() => {
  if (tmpFile) {
    tmpFile.cleanup();
  }
});

test('upgrades library version', async () => {
  const path = await useFixtureFile('test/fixtures/package.json');

  await service.upgradeLibrary(path, 'shelljs', '1.0.0');

  const packageJson = await readPackageJson(path);
  expect(packageJson).toMatchSnapshot();
  expect(packageJson.devDependencies['shelljs']).toBe('1.0.0');

  expect(await readPackageJsonRaw(path)).toMatchSnapshot();
});

test('can upgrade version in multiple locations', async () => {
  const path = await useFixtureFile('test/fixtures/package_multiple_locations.json');

  await service.upgradeLibrary(path, 'shelljs', '1.0.0', ['dependencies', 'devDependencies', 'peerDependencies']);

  const packageJson = await readPackageJson(path);
  expect(packageJson).toMatchSnapshot();
  expect(packageJson.devDependencies['shelljs']).toBe('1.0.0');
  expect(packageJson.dependencies['shelljs']).toBe('1.0.0');
  expect(packageJson.peerDependencies['shelljs']).toBe('1.0.0');
});

test('fails if package.json file not found', async () => {
  await expect(service.upgradeLibrary('test/fixture/non-existent-file.json', 'bitbucket', '2.10.0')).rejects
    .toThrow('File at \'test/fixture/non-existent-file.json\' is not found');
});

test('fails to downgrade the library version', async () => {
  const path = await useFixtureFile('test/fixtures/package.json');

  await expect(service.upgradeLibrary(path, 'bitbucket', '2.10.0')).rejects
    .toThrow('Current library version \'^2.11.0\' looks to be greater than supplied version \'2.10.0\'');
});

test('fails if library usage is found', async () => {
  const path = await useFixtureFile('test/fixtures/package.json');

  await expect(service.upgradeLibrary(path, 'axios', '2.10.0')).rejects
    .toThrow('Usage of library \'axios\' is not found in package.json');
});

async function useFixtureFile(path: string): Promise<string> {
  tmpFile = await tmp.file();
  await fs.copyFile(path, tmpFile.path);
  return tmpFile.path;
}

async function readPackageJson(path: string): Promise<PackageJson> {
  return JSON.parse(await fs.readFile(path, 'utf-8'));
}

async function readPackageJsonRaw(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8');
}
