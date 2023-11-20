import BitbucketApiClient from './bitbucket-api-client';
import BitbucketRemoteRepository from './bitbucket-remote-repo';
import { IRemoteRepository } from '../contracts/remote-repo';

export default class BitbucketHost {
  constructor(private readonly accessToken: string) {}

  // TODO: check if user has access to workspace/repoSlug (and throw AppError)
  async getRepo(workspace: string, repoSlug: string): Promise<IRemoteRepository> {

    const bitbucketClient = new BitbucketApiClient({
      baseUrl: 'https://api.bitbucket.org/2.0',
      auth: {
        token: this.accessToken,
      }
    });

    const repoResponse = await bitbucketClient.getRepo({ repoSlug, workspace });
    const { mainbranch: { name: mainBranchName }  } = repoResponse;

    const mainBranchDetailsResponse = await bitbucketClient.getBranch({
      repoSlug: repoSlug,
      workspace,
      branchName: mainBranchName
    });
    const { target: { hash: mainBranchHead } } = mainBranchDetailsResponse;

    return new BitbucketRemoteRepository(
      bitbucketClient,
      workspace,
      repoSlug,
      mainBranchName,
      mainBranchHead
    );
  }
}
