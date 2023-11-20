export interface RemoteBranch {
  name: string;
  head: string;
}

export interface PullRequest {
  id: number;
  link: string;
  title: string;
}

export interface PullRequestCreate {
  title: string;
  sourceBranch: string;
  targetBranch?: string;
}

export interface IRemoteRepository {

  createBranch(name: string, fromRef: string): Promise<RemoteBranch>;

  downloadFileContents(path: string): Promise<string>;

  createCommit(
    message: string,
    files: { [filePath: string]: string },
    branch: RemoteBranch,
    author: string): Promise<void>;


  openPullRequest(prData: PullRequestCreate): Promise<PullRequest>;

  readonly mainBranch: RemoteBranch
}
