import { GitHubIssue, CreatedIssue, Subtask } from '../types';

/**
 * GitHub API client for fetching issues and creating new issues
 */
export class GitHubClient {
  private pat: string;
  private baseUrl = 'https://api.github.com';

  constructor(pat: string) {
    this.pat = pat;
  }

  /**
   * Fetch a GitHub issue by URL or owner/repo/number
   */
  async fetchIssue(urlOrPath: string): Promise<GitHubIssue> {
    try {
      // Parse the URL to extract owner, repo, and issue number
      const parsed = parseGitHubIssueUrl(urlOrPath);
      if (!parsed) {
        throw new Error('Invalid GitHub issue URL format. Expected: https://github.com/owner/repo/issues/123');
      }

      const { owner, repo, issueNumber } = parsed;
      const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`;

      const response = await fetch(url, {
        headers:
          {
            'Authorization': `token ${this.pat}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ChopChop-Issue-Decomposer',
          },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Issue not found. This could be because:
• The repository is private and your PAT lacks 'repo' permissions
• The issue number doesn't exist
• The repository URL is incorrect
• Your PAT has expired or is invalid`);
        } else if (response.status === 401) {
          throw new Error('Invalid or expired GitHub Personal Access Token');
        } else if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded or insufficient permissions');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate the response has required fields
      if (!data || typeof data.id === 'undefined' || !data.title) {
        throw new Error('Invalid response from GitHub API - missing required fields');
      }

      // Convert to our internal format
      return {
        id: data.id.toString(),
        title: data.title,
        body: data.body || '',
        url: data.html_url,
        number: data.number,
        repository: `${owner}/${repo}`
      };

    } catch (error) {
      console.error('Failed to fetch GitHub issue:', error);
      throw error;
    }
  }

  /**
   * Create a new GitHub issue
   */
  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<CreatedIssue> {
    try {
      const issueData = {
        title,
        body,
        labels: labels || [],
      };

      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'ChopChop-Issue-Decomposer',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your GitHub Personal Access Token.');
        } else if (response.status === 403) {
          throw new Error('Permission denied. Please ensure your token has access to create issues in this repository.');
        } else if (response.status === 404) {
          throw new Error('Repository not found. Please check the repository path.');
        } else {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
      }

      const createdIssue = await response.json();

      return {
        number: createdIssue.number,
        url: createdIssue.html_url,
        title: createdIssue.title,
      };
    } catch (error) {
      console.error('Failed to create GitHub issue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create GitHub issue');
    }
  }

  /**
   * Create multiple issues from subtasks
   */
  async createSubtaskIssues(
    owner: string,
    repo: string,
    subtasks: Subtask[],
    parentIssueTitle: string,
    parentIssueUrl?: string
  ): Promise<CreatedIssue[]> {
    const createdIssues: CreatedIssue[] = [];

    for (const [index, subtask] of subtasks.entries()) {
      try {
        const body = this.formatSubtaskBody(subtask, index + 1, parentIssueTitle, parentIssueUrl);
        const labels = ['subtask', 'chopchop-generated'];

        if (subtask.isTooBig) {
          labels.push('needs-splitting');
        }

        const createdIssue = await this.createIssue(
          owner,
          repo,
          `[${index + 1}/${subtasks.length}] ${subtask.title}`,
          body,
          labels
        );

        createdIssues.push(createdIssue);

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to create issue for subtask ${index + 1}:`, error);
        throw new Error(`Failed to create issue for subtask: ${subtask.title}`);
      }
    }

    return createdIssues;
  }

  /**
   * Format subtask as GitHub issue body
   */
  private formatSubtaskBody(
    subtask: Subtask,
    taskNumber: number,
    parentTitle: string,
    parentUrl?: string
  ): string {
    const parentSection = parentUrl
      ? `**Parent Issue:** [${parentTitle}](${parentUrl})`
      : `**Parent Issue:** ${parentTitle}`;

    return `${parentSection}

**Task ${taskNumber} Description:**
${subtask.description}

## Acceptance Criteria
${subtask.acceptanceCriteria.map(criteria => `- [ ] ${criteria}`).join('\n')}

## Guardrails
${subtask.guardrails.map(guardrail => `- ⚠️ ${guardrail}`).join('\n')}

${subtask.isTooBig ? '\n⚠️ **Warning:** This task may be too large and should consider being split into smaller tasks.\n' : ''}

---
*Generated by ChopChop Issue Decomposer*`;
  }

  /**
   * Validate GitHub PAT by making a simple API call
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${this.pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ChopChop-Issue-Decomposer',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Validate repository access
   */
  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${this.pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ChopChop-Issue-Decomposer',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to validate repository:', error);
      return false;
    }
  }
}

/**
 * Parse GitHub issue URL to extract components
 */
export function parseGitHubIssueUrl(url: string): {
  owner: string;
  repo: string;
  issueNumber: string;
} | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Handle different URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/,
    /api\.github\.com\/repos\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const [, owner, repo, issueNumber] = match;
      return { owner, repo, issueNumber };
    }
  }

  return null;
}

/**
 * Standalone function for fetching GitHub issues
 */
export async function fetchGitHubIssue(
  config: { pat: string; repo: string },
  issueUrl: string
): Promise<GitHubIssue> {
  if (!config.pat) {
    throw new Error('GitHub Personal Access Token is required');
  }

  if (!issueUrl) {
    throw new Error('Issue URL is required');
  }

  const client = new GitHubClient(config.pat);
  return client.fetchIssue(issueUrl);
}

/**
 * Validate GitHub repository access
 */
export async function validateGitHubAccess(config: { pat: string; repo: string }): Promise<{
  isValid: boolean;
  canReadRepo: boolean;
  canCreateIssues: boolean;
  error?: string;
}> {
  if (!config.pat || !config.repo) {
    return {
      isValid: false,
      canReadRepo: false,
      canCreateIssues: false,
      error: 'GitHub PAT and repository are required',
    };
  }

  const [owner, repo] = config.repo.split('/');
  if (!owner || !repo) {
    return {
      isValid: false,
      canReadRepo: false,
      canCreateIssues: false,
      error: 'Invalid repository format. Use: owner/repository',
    };
  }

  try {
    const client = new GitHubClient(config.pat);
    const canRead = await client.validateRepository(owner, repo);

    return {
      isValid: canRead,
      canReadRepo: canRead,
      canCreateIssues: canRead, // Simplified for now
    };
  } catch (error) {
    return {
      isValid: false,
      canReadRepo: false,
      canCreateIssues: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}