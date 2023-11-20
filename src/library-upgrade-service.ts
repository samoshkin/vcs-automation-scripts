import type { PackageJson } from 'type-fest';
import fs from 'fs/promises';
import semver from 'semver';
import AppError from './errors';

type DependencyKind = 'devDependencies' | 'dependencies' | 'peerDependencies';

// TODO (low): check if given npm library exist in remote package registry
export default class LibraryUpgradeService {

  async upgradeLibrary(
    packageJsonFilePath: string,
    libraryName: string,
    newLibraryVersion: string,
    depKinds: DependencyKind[] = ['dependencies', 'devDependencies']): Promise<void> {

    // check if given library version is valid
    if (!semver.valid(newLibraryVersion)) {
      throw AppError.InvalidVersionFormat(newLibraryVersion);
    }

    const packageJson = await this.readPackageJson(packageJsonFilePath);

    // check if given library used in package.json
    if (!this.hasLibraryUsage(packageJson, libraryName, depKinds)) {
      throw AppError.LibraryUsageNotFound(libraryName);
    }

    // support upgrading version in multiple locations (dependencies, devDependencies, peerDependencies)
    const dependencyDeclarations = depKinds
      .map(x => packageJson[x] as PackageJson.Dependency)
      .filter(deps => libraryName in deps);
    for (const deps of dependencyDeclarations) {
      const currentVersionSpec = deps[libraryName];

      if (this.isVersionDowngrade(currentVersionSpec, newLibraryVersion)) {
        throw AppError.MaybeLibraryDowngrade(currentVersionSpec, newLibraryVersion);
      }

      deps[libraryName] = newLibraryVersion;
    }

    await this.writePackageJson(packageJsonFilePath, packageJson);
  }

  private async readPackageJson(filePath: string): Promise<PackageJson> {
    try {
      return JSON.parse(await fs.readFile(filePath, { encoding: 'utf-8' })) as PackageJson;
    } catch(e) {
      if (e.code === 'ENOENT') {
        throw AppError.FileNotFound(filePath);
      }
      throw e;
    }
  }

  private async writePackageJson(filePath: string, contents: PackageJson): Promise<void> {
    return fs.writeFile(filePath, JSON.stringify(contents, null, 2), { encoding: 'utf-8' });
  }

  private hasLibraryUsage(packageJson: PackageJson, libraryName: string, deps: DependencyKind[]): boolean {
    return deps.some(x => !!(packageJson[x] as PackageJson.Dependency)[libraryName]);
  }

  private isVersionDowngrade(currentVersion: string, newVersion: string) {
    // supports both cases:
    // - if current version points to a semver range (e.g ^x.y.z or ~x.y.z)
    // - if current version is a plain version (e.g x.y.z)
    return (semver.validRange(currentVersion) && semver.ltr(newVersion, currentVersion))
      || semver.valid(currentVersion) && semver.lt(newVersion, currentVersion);
  }
}
