import BitbucketApiClient from './bitbucket-api-client';
import { IRemoteRepository, RemoteBranch } from '../contracts/remote-repo';
import { PullRequestCreate, PullRequest } from '../contracts/remote-repo';

/**
 * Represents an implementation of remote repository concept
 * which specifically work with bitbucket repos
 */
export default class BitbucketRemoteRepository implements IRemoteRepository {
  /**
   * Creates a new instance of the constructor.
   *
   * @param {BitbucketApiClient} bitbucketClient - The Bitbucket API client.
   * @param {string} workspace - bitbucket workspace
   * @param {string} repoSlug - bitbucket repo slug
   * @param {string} mainBranchRef - The main branch name
   * @param {string} mainBrachHead - The main branch commit hash
   */
  constructor(
    private readonly bitbucketClient: BitbucketApiClient,
    private readonly workspace: string,
    private readonly repoSlug: string,
    private readonly mainBranchRef: string,
    private readonly mainBrachHead: string) {
  }

  /**
   * Returns the info about repository's main branch
   */
  get mainBranch (): RemoteBranch {
    return {
      name: this.mainBranchRef,
      head: this.mainBrachHead,
    };
  }

  /**
   * Opens a pull request with the given data
   *
   * @param {PullRequestCreate} prData - The data for creating the pull request.
   * @param {string} prData.title - PR's title
   * @param {string} prData.sourceBranch - PR's source branch
   * @param {string} prData.targetBranch - PR's target branch
   * @return {Promise<PullRequest>} the created pull request.
   */
  async openPullRequest(prData: PullRequestCreate): Promise<PullRequest> {
    const response = await this.bitbucketClient.openPullRequest({
      workspace: this.workspace,
      repoSlug: this.repoSlug,
      title: prData.title,
      sourceBranch: prData.sourceBranch,
      targetBranch: prData.targetBranch || this.mainBranch.name,
    });

    return {
      id: response.id,
      link: response.links.html.href,
      title: response.title
    };
  }


  /**
   * Creates a new branch in the repository from the given commit ref.
   *
   * @param {string} branchName - The name of the new branch.
   * @param {string} fromRef - commit hash to create branch from
   * @return {Promise<RemoteBranch>} A promise that resolves to the newly created branch
   */
  async createBranch(branchName: string, fromRef: string): Promise<RemoteBranch> {
    const response = await this.bitbucketClient.createBranch({
      workspace: this.workspace,
      repoSlug: this.repoSlug,
      name: branchName,
      fromRef,
    });
    const { name, target: { hash: head } } = response;
    return { name, head };
  }

  /**
   * Creates a new commit with the given files and message
   *
   * @param {string} message - The commit message.
   * @param {{ [filePath: string]: string }} files - An object containing file paths as keys (relative to repo root) and file contents as values (raw textual content of a file).
   * @param {RemoteBranch} branch - The branch to create the commit on
   * @param {string} author - The author of the commit.
   * @return {Promise<void>} - A Promise that resolves when the commit is created.
   */
  async createCommit(
    message: string,
    files: { [filePath: string]: string },
    branch: RemoteBranch,
    author: string): Promise<void> {

    const formData = new FormData();
    for (const [filePath, fileContents] of Object.entries(files)) {
      formData.set(filePath, new Blob([fileContents]));
    }

    await this.bitbucketClient.createFileCommit({
      workspace: this.workspace,
      repoSlug: this.repoSlug,
      body: formData,
      message: message,
      author: author,
      branch: branch.name,
    });
  }

  /**
   * Downloads the contents of a file from given commit
   *
   * @param {string} path - The path of the file to download (relative to repo root)
   * @return {Promise<string>} A promise that resolves with the contents of the file (raw textual content)
   */
  async downloadFileContents(path: string): Promise<string> {
    const fileContents = await this.bitbucketClient.getFileContents({
      commit: this.mainBrachHead,
      path,
      workspace: this.workspace,
      repoSlug: this.repoSlug,
    });
    return fileContents;
  }
}
