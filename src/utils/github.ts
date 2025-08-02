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
    let owner: string, repo: string, issueNumber: number;

    // Parse GitHub URL
    const urlMatch = urlOrPath.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (urlMatch) {
      [, owner, repo] = urlMatch;
      issueNumber = parseInt(urlMatch[3], 10);
    } else {
      // Parse path format: owner/repo/issues/123
      const pathMatch = urlOrPath.match(/^([^/]+)\/([^/]+)\/issues\/(\d+)$/);
      if (pathMatch) {
        [, owner, repo] = pathMatch;
        issueNumber = parseInt(pathMatch[3], 10);
      } else {
        throw new Error('Invalid GitHub issue URL or path format');
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ChopChop-Issue-Decomposer',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Issue not found. Please check the URL and your access permissions.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please check your GitHub Personal Access Token.');
        } else {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
      }

      const issueData = await response.json();
      
      return {
        title: issueData.title,
        body: issueData.body || '',
        url: issueData.html_url,
      };
    } catch (error) {
      console.error('Failed to fetch GitHub issue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch GitHub issue');
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
}