interface BranchResponse {
  name: string;
  type: string,
  target: {
    hash: string;
  }
}

interface RepoResponse {
  name: string;
  type: string;
  mainbranch: {
    type: string;
    name: string;
  }
}

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

export default class BitbucketApiClient {
  private baseUrl: string;
  private authToken: string;

  constructor(options: {
    baseUrl: string,
    auth: {
      token: string
    }
  }){
    this.baseUrl = options.baseUrl || 'https://api.bitbucket.org/2.0/';
    this.authToken = options.auth.token;
  }

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
