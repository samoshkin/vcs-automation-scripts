/**
 * Represents branch info (name and commit hash of its HEAD)
 */
export interface RemoteBranch {
  name: string;
  head: string;
}

/**
 * Represents the pull request info
 */
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

/**
 * Represents an abstract concept of remote repository
 * This concept allows us to work with any VSC provider (github, bitbucket, gitlab)
 * so that the choice of VSC provider remains transparent for the application code
 */
export interface IRemoteRepository {

  /**
   * Returns the info about repository's main branch
   */
  readonly mainBranch: RemoteBranch

  /**
   * Creates a new branch in the repository from the given commit ref.
   *
   * @param {string} branchName - The name of the new branch.
   * @param {string} fromRef - commit hash to create branch from
   * @return {Promise<RemoteBranch>} A promise that resolves to the newly created branch
   */
  createBranch(name: string, fromRef: string): Promise<RemoteBranch>;

  /**
   * Downloads the contents of a file from given commit
   *
   * @param {string} path - The path of the file to download (relative to repo root)
   * @return {Promise<string>} A promise that resolves with the contents of the file (raw textual content)
   */
  downloadFileContents(path: string): Promise<string>;

  /**
   * Creates a new commit with the given files and message
   *
   * @param {string} message - The commit message.
   * @param {{ [filePath: string]: string }} files - An object containing file paths as keys (relative to repo root) and file contents as values (raw textual content of a file).
   * @param {RemoteBranch} branch - The branch to create the commit on
   * @param {string} author - The author of the commit.
   * @return {Promise<void>} - A Promise that resolves when the commit is created.
   */
  createCommit(
    message: string,
    files: { [filePath: string]: string },
    branch: RemoteBranch,
    author: string): Promise<void>;

  /**
   * Opens a pull request with the given data
   *
   * @param {PullRequestCreate} prData - The data for creating the pull request.
   * @param {string} prData.title - PR's title
   * @param {string} prData.sourceBranch - PR's source branch
   * @param {string} prData.targetBranch - PR's target branch
   * @return {Promise<PullRequest>} the created pull request.
   */
  openPullRequest(prData: PullRequestCreate): Promise<PullRequest>;


}
