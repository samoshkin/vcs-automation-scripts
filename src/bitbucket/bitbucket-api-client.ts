/**
 * Branch information as returned from Bitbucket API
 *
 * NOTE: only essential fields are mentioned
 */
interface BranchResponse {
  name: string;
  type: string,
  target: {
    hash: string;
  }
}

/**
 * Repo information as returned from Bitbucket API
 *
 * NOTE: only essential fields are mentioned
 */
interface RepoResponse {
  name: string;
  type: string;
  mainbranch: {
    type: string;
    name: string;
  }
}

/**
 * Pull request information as returned from Bitbucket API
 *
 * NOTE: only essential fields are mentioned
 */
interface PullRequestResponse {
  type: string
  id: number;
  links: {
    html: {
      href: string;
    }
  },
  title: string;
}

type FileResponse = string;

/**
 * Basic wrapper object over Bitbucket HTTP API
 * so you don't need to craft HTTP requests manually
 * https://developer.atlassian.com/cloud/bitbucket/rest/intro
 */
export default class BitbucketApiClient {
  private baseUrl: string;
  private authToken: string;

  /**
   * Creates an instance of BitbucketApiClient
   *
   * @param {string} [options.baseUrl] - base URL for the Bitbucket API.
   * @param {string} options.auth.token - repo access token
   */
  constructor(options: {
    baseUrl?: string,
    auth: {
      token: string
    }
  }){
    this.baseUrl = options.baseUrl || 'https://api.bitbucket.org/2.0';
    this.authToken = options.auth.token;
  }


   /**
   * Opens a pull request with the given options.
   *
   * @param {Object} options - options describing details of pull request
   * @param {string} options.workspace - bitbucket workspace
   * @param {string} options.repoSlug - bitbucket repo slug
   * @param {string} options.title - title of the request
   * @param {string} options.sourceBranch - source branch
   * @param {string} options.targetBranch - target branch
   * @return {Promise<PullRequestResponse>} - A promise that resolves to the pull request response
   */
  async openPullRequest(options: {
    workspace: string,
    repoSlug: string,
    title: string,
    sourceBranch: string,
    targetBranch: string,
  }): Promise<PullRequestResponse> {
    const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/pullrequests`, {
      method: 'POST',
      body: JSON.stringify({
        title: options.title,
        source: {
          branch: {
            name: options.sourceBranch
          }
        },
        destination: {
          branch: {
            name: options.targetBranch
          }
        }
      }),
      headers: {
        ...(this.getHeaders()),
        'Content-Type': 'application/json',
      },
    });

    await this.ensureResponseOk(response);
    return await response.json() as PullRequestResponse;
  }

  /**
   * Creates a new commit at specific branch by applying given files
   *
   * @param {object} options - The options for creating the file commit.
   * @param {string} options.workspace - bitbucket workspace
   * @param {string} options.repoSlug - bitbucket repo slug
   * @param {string} options.message - The commit message.
   * @param {string} options.author - The author of the commit.
   * @param {string} options.branch - the branch name where the commit is supposed to be added
   * @param {FormData} options.body - FormData object containing files
   * Each file is keyed by file path, which is relative to repo root
   */
  async createFileCommit(options: {
    workspace: string,
    repoSlug: string,
    message: string,
    author: string,
    branch: string,
    body: FormData
  }): Promise<void> {
    options.body.set('message', options.message);
    options.body.set('author', options.author);
    options.body.set('branch', options.branch);

    const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/src?`, {
      method: 'POST',
      body: options.body,
      headers: {
          Authorization: `Bearer ${this.authToken}`,
      },
    });
    await this.ensureResponseOk(response);
  }

  /**
   * Retrieves a repo information from the API
   *
   * @param {string} options.workspace - bitbucket workspace
   * @param {string} options.repoSlug - bitbucket slug
   * @return {Promise<RepoResponse>} - A promise that resolves to the repository response info.
   */
  async getRepo(options: {
    workspace: string,
    repoSlug: string
  }): Promise<RepoResponse> {
    const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}`, {
      method: 'GET',
      headers: {
          Authorization: `Bearer ${this.authToken}`,
      },
    });
    await this.ensureResponseOk(response);
    return await response.json() as RepoResponse;
  }

  /**
   * Retrieves the branch information
   *
   * @param {string} options.workspace - bitbucket workspace
   * @param {string} options.repoSlug - bitbucket slug
   * @param {string} options.branchName - the name of the branch.
   * @return {Promise<BranchResponse>} A promise that resolves with the branch info.
   */
  async getBranch(options: {
    workspace: string,
    repoSlug: string
    branchName: string,
  }): Promise<BranchResponse> {

    const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/refs/branches/${options.branchName}`, {
      method: 'GET',
      headers: {
        ...(this.getHeaders())
      },
    });
    await this.ensureResponseOk(response);
    return await response.json() as BranchResponse;
  }

  /**
   * Creates a new branch in the specified repo.
   *
   * @param {string} options.workspace - bitbucket workspace
   * @param {string} options.repoSlug - bitbucket slug
   * @param {string} options.name - the name of the new branch.
   * @param {string} options.fromRef - the reference (commit hash) from which to create the branch.
   * @return {Promise<BranchResponse>} A promise that resolves with the newly created branch info
   */
  async createBranch(options: {
    workspace: string,
    repoSlug: string,
    name: string
    fromRef: string
  }): Promise<BranchResponse> {
    const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/refs/branches`, {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        target : {
          hash : options.fromRef,
        }
      }),
      headers: {
        ...(this.getHeaders()),
        'Content-Type': 'application/json',
      },
    });
    await this.ensureResponseOk(response);
    return await response.json() as BranchResponse;
  }

  /**
   * Downloads the raw contents of a file from a given repo
   *
   * @param {Object} options - The options for retrieving the file contents.
   * @param {string} options.workspace - bitbucket workspace
   * @param {string} options.repoSlug - bitbucket repository slug
   * @param {string} options.path - The path to the file (relative to repo root)
   * @param {string} options.commit - the commit hash where to look for the file.
   * @return {Promise<FileResponse>} A promise that resolves with the file contents.
   */
  async getFileContents(options: {
    workspace: string,
    repoSlug: string,
    path: string,
    commit: string,
  }): Promise<FileResponse> {
    const response = await fetch(`${this.baseUrl}/repositories/${options.workspace}/${options.repoSlug}/src/${options.commit}/${options.path}`, {
      method: 'GET',
      headers: {
        ...(this.getHeaders())
      },
    });
    await this.ensureResponseOk(response);
    return await response.text();
  }

  private async ensureResponseOk(response: Response) {
    if(!response.ok) {
      throw new BitbucketApiClientError(`Bitbucket API client error. status: ${response.status}. Response: ${await response.text()}}`);
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.authToken}`
    };
  }
}

class BitbucketApiClientError extends Error {}
