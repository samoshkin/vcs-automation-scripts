import BitbucketApiClient from './bitbucket-api-client';
import BitbucketRemoteRepository from './bitbucket-remote-repo';
import { IRemoteRepository } from '../contracts/remote-repo';

// TODO: check if user has access to workspace/repoSlug (and throw AppError)

/**
 * Represents the Bitbucket server instance
 * Instance is authenticated with repo access token
 * Use it to obtain access to a repository
 */
export default class BitbucketHost {
  constructor(private readonly accessToken: string) {}

  /**
   * Obtains the wrapper object over remote repository
   *
   * @param {string} workspace - bitbucket workspace
   * @param {string} repoSlug - bitbucket repo slug
   * @return {Promise<IRemoteRepository>} A promise that resolves to an instance of the IRemoteRepository interface.
   */
  async getRepo(workspace: string, repoSlug: string): Promise<IRemoteRepository> {

    const bitbucketClient = new BitbucketApiClient({
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
