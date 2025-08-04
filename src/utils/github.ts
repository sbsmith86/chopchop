import { Subtask, CreatedIssue, GitHubIssue } from '../types';

// Move interfaces to the top of the file, outside any class
export interface IssueCreationProgress {
  currentIssue: number;
  totalIssues: number;
  currentTask: string;
  status: 'creating' | 'completed' | 'error';
  createdIssue?: CreatedIssue;
  error?: string;
}

export type ProgressCallback = (progress: IssueCreationProgress) => void;

export interface GitHubApiIssue {
  number: number;
  title: string;
  body: string;
  url: string;
  state: string;
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * GitHub API client for creating issues
 */
export class GitHubClient {
  private baseUrl = 'https://api.github.com';

  constructor(private token: string) {}

  /**
   * Fetch a GitHub issue by URL
   */
  async fetchIssue(issueUrl: string): Promise<GitHubApiIssue> {
    const parsed = parseGitHubIssueUrl(issueUrl);
    if (!parsed) {
      throw new Error('Invalid GitHub issue URL format');
    }

    const { owner, repo, issueNumber } = parsed;

    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Issue not found. Please check the URL and your access permissions.');
        }
        if (response.status === 401) {
          throw new Error('Invalid GitHub token or insufficient permissions.');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        number: data.number,
        title: data.title || '',
        body: data.body || '',
        url: data.html_url || issueUrl,
        state: data.state || 'open',
        labels: (data.labels || []).map((label: any) =>
          typeof label === 'string' ? label : label.name || ''
        ),
        assignees: (data.assignees || []).map((assignee: any) => assignee.login || ''),
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch GitHub issue');
    }
  }

  /**
   * Validate repository access
   */
  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create GitHub issues from subtasks with progress tracking
   */
  async createSubtaskIssues(
    owner: string,
    repo: string,
    subtasks: Subtask[],
    parentTitle: string,
    parentUrl?: string,
    onProgress?: ProgressCallback
  ): Promise<CreatedIssue[]> {
    const createdIssues: CreatedIssue[] = [];

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = subtasks[i];

      try {
        // Report progress: starting this issue
        onProgress?.({
          currentIssue: i + 1,
          totalIssues: subtasks.length,
          currentTask: subtask.title,
          status: 'creating'
        });

        // Add small delay for UX (shows progress)
        await new Promise(resolve => setTimeout(resolve, 500));

        const body = this.buildIssueBody(subtask, i + 1, subtasks.length, parentTitle, parentUrl);

        const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `${i + 1}. ${subtask.title}`,
            body,
            labels: [...(subtask.tags || []), 'chopchop-generated']
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`);
        }

        const issueData = await response.json();
        const createdIssue: CreatedIssue = {
          number: issueData.number,
          title: issueData.title,
          url: issueData.html_url,
          subtaskId: subtask.id
        };

        createdIssues.push(createdIssue);

        // Report progress: completed this issue
        onProgress?.({
          currentIssue: i + 1,
          totalIssues: subtasks.length,
          currentTask: subtask.title,
          status: 'completed',
          createdIssue
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Report error
        onProgress?.({
          currentIssue: i + 1,
          totalIssues: subtasks.length,
          currentTask: subtask.title,
          status: 'error',
          error: errorMessage
        });

        throw error; // Re-throw to stop the process
      }
    }

    return createdIssues;
  }

  /**
   * Build issue body with subtask details
   */
  private buildIssueBody(
    subtask: Subtask,
    taskNumber: number,
    totalTasks: number,
    parentTitle: string,
    parentUrl?: string
  ): string {
    const parentSection = parentUrl
      ? `**Original Issue:** [${parentTitle}](${parentUrl})\n\n`
      : `**Original Issue:** ${parentTitle}\n\n`;

    const acceptanceCriteria = (subtask.acceptanceCriteria || []).length > 0
      ? `## Acceptance Criteria\n\n${(subtask.acceptanceCriteria || []).map(criteria => `- [ ] ${criteria}`).join('\n')}\n\n`
      : '';

    const guardrails = (subtask.guardrails || []).length > 0
      ? `## Guardrails\n\n${(subtask.guardrails || []).map(guardrail => `- ⚠️ ${guardrail}`).join('\n')}\n\n`
      : '';

    const tags = (subtask.tags || []).length > 0
      ? `**Tags:** ${(subtask.tags || []).map(tag => `\`${tag}\``).join(', ')}\n`
      : '';

    const estimation = `**Estimated Hours:** ${subtask.estimatedHours || 1}\n`;
    const sequence = `**Task ${taskNumber} of ${totalTasks}**\n`;

    const dependencies = (subtask.dependsOn || []).length > 0
      ? `**Dependencies:** ${(subtask.dependsOn || []).join(', ')}\n`
      : '';

    return `${parentSection}${sequence}${estimation}${dependencies}${tags}

## Description

${subtask.description || 'No description provided'}

${acceptanceCriteria}${guardrails}---
*This issue was automatically generated by ChopChop Issue Decomposer*`;
  }

  /**
   * Test GitHub connection
   */
  async testConnection(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create a single GitHub issue
   */
  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<CreatedIssue> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: labels || []
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`);
    }

    const issueData = await response.json();

    return {
      number: issueData.number,
      title: issueData.title,
      url: issueData.html_url,
      subtaskId: '' // Not applicable for single issues
    };
  }

  /**
   * Post a comment to a GitHub issue
   */
  async createIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<{ id: number; url: string }> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`);
    }

    const commentData = await response.json();

    return {
      id: commentData.id,
      url: commentData.html_url
    };
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
): Promise<GitHubApiIssue> {
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
 * Post clarification questions as a comment on a GitHub issue
 */
export async function postClarificationQuestions(
  config: { pat: string; repo: string },
  issueUrl: string,
  questions: string[]
): Promise<{ id: number; url: string }> {
  if (!config.pat) {
    throw new Error('GitHub Personal Access Token is required');
  }

  const parsed = parseGitHubIssueUrl(issueUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub issue URL format');
  }

  const client = new GitHubClient(config.pat);
  const { owner, repo, issueNumber } = parsed;

  // Format the questions as a nice comment
  const commentBody = `## 🤔 Clarification Questions

I've analyzed this issue and have some questions to help create a more accurate breakdown:

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---
*This comment was generated by ChopChop to help clarify requirements before breaking down the issue into subtasks.*`;

  return client.createIssueComment(owner, repo, parseInt(issueNumber), commentBody);
}

/**
 * Post clarification answers as a comment on a GitHub issue
 */
export async function postClarificationAnswers(
  config: { pat: string; repo: string },
  issueUrl: string,
  questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<{ id: number; url: string }> {
  if (!config.pat) {
    throw new Error('GitHub Personal Access Token is required');
  }

  const parsed = parseGitHubIssueUrl(issueUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub issue URL format');
  }

  const client = new GitHubClient(config.pat);
  const { owner, repo, issueNumber } = parsed;

  // Format the Q&A as a nice comment
  const commentBody = `## ✅ Clarification Answers

Here are the answers to the clarification questions:

${questionsAndAnswers.map((qa, i) => `**${i + 1}. ${qa.question}**
${qa.answer}

`).join('')}---
*These answers will be used as context when breaking down the issue into subtasks.*`;

  return client.createIssueComment(owner, repo, parseInt(issueNumber), commentBody);
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