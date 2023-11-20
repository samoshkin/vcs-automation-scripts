import BitbucketApiClient from './bitbucket-api-client';
import { IRemoteRepository, RemoteBranch } from '../contracts/remote-repo';
import { PullRequestCreate, PullRequest } from '../contracts/remote-repo';

export default class BitbucketRemoteRepository implements IRemoteRepository {
  constructor(
    private readonly bitbucketClient: BitbucketApiClient,
    private readonly workspace: string,
    private readonly repoSlug: string,
    private readonly mainBranchRef: string,
    private readonly mainBrachHead: string) {
  }

  get mainBranch (): RemoteBranch {
    return {
      name: this.mainBranchRef,
      head: this.mainBrachHead,
    };
  }

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
