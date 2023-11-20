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



// class BitbucketApiClientError extends Error {}

// class BitbucketApi2Client {
//   private baseUrl: string;
//   private authToken: string;

//   constructor(options: {
//     baseUrl: string,
//     auth: {
//       token: string
//     }
//   }){
//     this.baseUrl = options.baseUrl || 'https://api.bitbucket.org/2.0/';
//     this.authToken = options.auth.token;
//   }

//   async createFileCommit(options: {
//     workspace: string,
//     repoSlug: string,
//     message: string,
//     author?: string,
//     branch: string,
//     body: FormData
//   }): Promise<Response> {
//     const params = new URLSearchParams({
//       message: options.message,
//       author: options.author,
//       branch: options.branch,
//     }).toString();

//     const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/src?${params}`, {
//       method: 'POST',
//       body: options.body,
//       headers: {
//           Authorization: `Bearer ${this.authToken}`,
//       },
//     });
//     return response;
//     // if (!response.ok) {
//     //   throw new BitbucketApiClientError(`Bitbucket API client error. status: ${response.status}. Response: ${await response.text()}`);
//     // }
//     // return response;
//   }

//   async getRepo(options: {
//     workspace: string,
//     repoSlug: string
//   }) {
//     const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}`, {
//       method: 'GET',
//       headers: {
//           Authorization: `Bearer ${this.authToken}`,
//       },
//     });
//     return response;
//   }

//   async getBranch(options: {
//     workspace: string,
//     repoSlug: string
//     branchName: string,
//   }): Promise<Response> {

//     const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/refs/branches/${options.branchName}`, {
//       method: 'GET',
//       headers: {
//           Authorization: `Bearer ${this.authToken}`,
//       },
//     });
//     return response;
//   }

//   async createBranch(options: {
//     workspace: string,
//     repoSlug: string,
//     name: string
//     fromRef: string
//   }): Promise<Response> {
//     const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/refs/branches`, {
//       method: 'POST',
//       body: JSON.stringify({
//         name: options.name,
//         target : {
//           hash : options.fromRef,
//         }
//       }),
//       headers: {
//           Authorization: `Bearer ${this.authToken}`,
//       },
//     });
//     return response;
// }

// class BitbucketHost {
//   constructor(private readonly accessToken: string) {}

//   // TODO: connect to bitbucket
//   // TODO: check if user has access to workspace/repoSlug
//   // TODO: create RemoteRepository instance
//   async getRepo(workspace: string, repoSlug: string): Promise<IRemoteRepository> {

//     const bitbucketClient = new Bitbucket({
//       baseUrl: 'https://api.bitbucket.org/2.0',
//       auth: {
//         token: this.accessToken,
//       }
//     });

//     const repoResponse = await bitbucketClient.repositories.get({ repo_slug: repoSlug, workspace });
//     const { mainbranch: { name: mainBranchName }  } = repoResponse.data;

//     const mainBranchDetailsResponse = await bitbucketClient.refs.getBranch({
//       name: mainBranchName,
//       repo_slug: repoSlug,
//       workspace,
//     });
//     const { target: { hash: mainBranchHead } } = mainBranchDetailsResponse.data;

//     return new BitbucketRemoteRepository(
//       bitbucketClient,
//       workspace,
//       repoSlug,
//       mainBranchName,
//       mainBranchHead
//     );
//   }
// }




// bitbucket.authenticate({
//     type: 'basic',
//     username: 'USER_BITBUCKET_USERNAME',
//     password: 'APP_PASSWORD_TOKEN'
// });



// TODO (low): prints help
// TODO: parse script args from different sources
// TODO (low): validates them, check if required args are not missing

// class BitbucketRemoteRepository implements IRemoteRepository {
//   constructor(
//     private readonly bitbucketClient: BitbucketApiClient,
//     private readonly workspace: string,
//     private readonly repoSlug: string,
//     private readonly mainBranchRef: string,
//     private readonly mainBrachHead: string) {
//   }

//   get mainBranch () {
//     return {
//       name: this.mainBranchRef,
//       head: this.mainBrachHead,
//     };
//   }


//   async createBranch(branchName: string, fromRef: string): Promise<RemoteBranch> {
//     const response = await this.bitbucketClient.refs.createBranch({
//       workspace: this.workspace,
//       repo_slug: this.repoSlug,
//       _body: {
//         branchName,
//         target : {
//           hash : fromRef,
//         }
//       }
//     });

//     const { name, target: { hash: head } } = response.data;
//     return { name, head };
//   }

//   async createCommit(message: string, author: string, files: { [filePath: string]: string }, branch: RemoteBranch): Promise<void> {

//     const formData = new FormData();
//     for (const [filePath, fileContents] of Object.entries(files)) {
//       formData.set(filePath, new Blob([fileContents]));
//     }

//     const params = new URLSearchParams({
//       message: message,
//       author: author,
//       branch: branch.name,
//     }).toString();

//     const response = await fetch(`https://api.bitbucket.org/2.0/repositories/${this.workspace}/${this.repoSlug}/src?${params}`, {
//       method: 'POST',
//       body: formData,
//       headers: {
//           Authorization: 'Bearer ATCTT3xFfGN0pwlO9VCFPP-X_91SBAfawZfN_ywaLLmD1zh60nJduqeTRv28u3f0PuJxJ8_yl5ZHA5621-fl0Xst4AgxmADvk50jK5Vu_OUpBZDr3wk4gKmXRLQH_3yuuI5EmWZkt-Fd50in6ssBi8g5t5PUw8OCkB9iTBrQNzejGWMX6k0AOm4=0B69EAC7',
//       },
//     });
//     console.log(response.status);
//     const data = await response.text();



//     // const response = await this.bitbucketClient.repositories.createSrcFileCommit({
//     //   workspace: this.workspace,
//     //   repo_slug: this.repoSlug,
//     //   message,
//     //   author,
//     //   branch: branch.name,
//     //   _body: formData,
//     // });
//   }



//   async downloadFileContents(path: string): Promise<string> {
//     return (await this.bitbucketClient.source.read({
//       commit: this.mainBrachHead,
//       path,
//       workspace: this.workspace,
//       repo_slug: this.repoSlug,
//     })).data as string;
//   }
// }
