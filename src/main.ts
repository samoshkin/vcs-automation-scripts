import fs from 'fs/promises';
import * as tmp from 'tmp-promise';
import LibraryUpgradeService from './library-upgrade-service';
import { BitbucketHost } from './bitbucket';
import { parseScriptArgs } from './inputs';

export async function main(): Promise<void> {

  const args = parseScriptArgs();

  console.log('Script start: upgrade-library-version');
  console.log(`library: ${args.libraryName}; version: ${args.libraryVersion}`);

  const libraryUpgrader = new LibraryUpgradeService();
  const bitbucketHost = new BitbucketHost(args.accessToken);
  const remoteRepo = await bitbucketHost.getRepo(args.workspace, args.repoSlug);

  // assume repo root dir is a project root dir (one that contains package.json)
  // e.g does not support a monorepo scenario
  const packageJsonRaw = await remoteRepo.downloadFileContents('package.json');
  const tmpFile = await tmp.file();
  await fs.writeFile(tmpFile.path, packageJsonRaw);

  await libraryUpgrader.upgradeLibrary(tmpFile.path, args.libraryName, args.libraryVersion);

  const libUpgradeBranch = await remoteRepo.createBranch(
    `lib-upgrade-${args.libraryName}-${args.libraryVersion}`,
    remoteRepo.mainBranch.head);

  await remoteRepo.createCommit(
    'test commit',
    {
      'package.json': await fs.readFile(tmpFile.path, 'utf-8')
    },
    libUpgradeBranch,
    'vcs-automation-scripts <test@test.com>'
  );

  const pr = await remoteRepo.openPullRequest({
    sourceBranch: libUpgradeBranch.name,
    title: `Library version upgrade: ${args.libraryName} => ${args.libraryVersion}`,
  });

  console.log(`Library version upgraded: ${args.libraryName} => ${args.libraryVersion}`);
  console.log(`PR created: ${pr.link}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Script failure');
    console.error(err.message);
    process.exit(1);
  });
}
