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
        labels: (data.labels || []).map((label: unknown) =>
          typeof label === 'string' ? label : (label as { name?: string }).name || ''
        ),
        assignees: (data.assignees || []).map((assignee: unknown) => (assignee as { login?: string }).login || ''),
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
  async postIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`);
    }
  }

  /**
   * Post summary comment to parent issue after subtasks are created
   */
  async postChopChopSummary(
    parentIssueUrl: string,
    subtasks: Subtask[],
    createdIssues: CreatedIssue[]
  ): Promise<void> {
    const parsed = parseGitHubIssueUrl(parentIssueUrl);
    if (!parsed) {
      throw new Error('Invalid parent issue URL');
    }

    const { owner, repo, issueNumber } = parsed;
    const summaryContent = this.generateSummaryContent(subtasks, createdIssues);
    
    await this.postIssueComment(owner, repo, parseInt(issueNumber), summaryContent);
  }

  /**
   * Generate the ChopChop summary content with required format
   */
  private generateSummaryContent(subtasks: Subtask[], createdIssues: CreatedIssue[]): string {
    // Calculate complexity analysis
    const totalComplexity = subtasks.reduce((sum, task) => sum + (task.estimatedHours || 1), 0);
    const subtaskCount = subtasks.length;
    const estimatedTime = totalComplexity; // Simplified: 1 complexity point = 1 day
    
    // Generate implementation order with rationale
    const implementationOrder = this.generateImplementationOrder(subtasks, createdIssues);
    const quickReference = createdIssues.map(issue => `#${issue.number}`).join(' → ');
    
    // Generate dependency diagram
    const dependencyDiagram = this.generateDependencyDiagram(subtasks, createdIssues);
    
    // Generate subtask list with links
    const allSubtaskIssues = createdIssues.map(issue => 
      `#${issue.number} - ${issue.title}`
    ).join('\n');

    return `🎯 Implementation Order & Assignment Guide

📊 Complexity Analysis
Total Complexity Score: ${totalComplexity}/45
Estimated Development Time: ${estimatedTime} days
Breakdown Recommendation: Issue should be broken down into subtasks
Subtasks Created: ${subtaskCount}

🚀 IMPLEMENTATION ORDER FOR GITHUB COPILOT
Work on these issues in this exact order:

${implementationOrder}

QUICK REFERENCE - Implementation Order:
${quickReference}

🏗️ Dependency Chain Diagram
${dependencyDiagram}

🎪 Event Management Context
This implementation supports the following event types:
- GitHub Issues and Project Management
- Automated Task Decomposition
- Development Workflow Coordination

🔒 Critical Requirements
- Database Isolation: All data must be properly scoped
- Event Scoping: Multi-tenant security considerations
- Manual Testing: Validate functionality after implementation
- Zero Errors: ESLint/Prettier must report zero errors/warnings
- TypeScript: Full compilation success required
- Documentation: JSDoc comments for all public functions

🎯 GitHub Copilot Assignment Workflow
1. Start with Foundation: Review core requirements and dependencies
2. Core Logic: Implement main functionality after dependencies
3. Integration: Connect components after core logic is stable
4. User Interface: Build UI components after backend is ready
5. Advanced Features: Add enhancements after core features work
6. Manual Testing: Validate each component after implementation

🔗 All Subtask Issues:
${allSubtaskIssues}

**Generated by ChopChop a ticket decomposer tool**`;
  }

  /**
   * Generate implementation order with rationale
   */
  private generateImplementationOrder(subtasks: Subtask[], createdIssues: CreatedIssue[]): string {
    return createdIssues.map((issue, index) => {
      const subtask = subtasks.find(s => s.id === issue.subtaskId);
      const rationale = this.generateRationale(subtask, index, subtasks.length);
      
      return `${index + 1}. Issue #${issue.number} - ${issue.title}
Why this order: ${rationale}`;
    }).join('\n\n');
  }

  /**
   * Generate rationale for task ordering
   */
  private generateRationale(subtask: Subtask | undefined, index: number, total: number): string {
    if (!subtask) {
      return `Task ${index + 1} of ${total} - Complete in sequence for optimal workflow`;
    }

    // Check for dependencies
    if (subtask.dependsOn && subtask.dependsOn.length > 0) {
      return `Depends on ${subtask.dependsOn.join(', ')} - must complete prerequisites first`;
    }

    // Generate rationale based on common patterns
    const title = subtask.title.toLowerCase();
    
    if (title.includes('auth') || title.includes('security') || title.includes('permission')) {
      return 'Security foundation - required before any user-facing features';
    }
    
    if (title.includes('database') || title.includes('model') || title.includes('schema')) {
      return 'Foundation layer - all other features depend on data models';
    }
    
    if (title.includes('api') || title.includes('endpoint') || title.includes('server')) {
      return 'Backend logic - requires database and auth to be functional';
    }
    
    if (title.includes('ui') || title.includes('component') || title.includes('frontend')) {
      return 'Frontend foundation - requires backend APIs to be ready';
    }
    
    if (title.includes('test') || title.includes('quality')) {
      return 'Quality assurance - validates all implemented features';
    }
    
    if (title.includes('dashboard') || title.includes('management') || title.includes('admin')) {
      return 'Advanced UI - builds on basic UI components';
    }
    
    if (title.includes('ai') || title.includes('integration') || title.includes('advanced')) {
      return 'Advanced features - requires all other systems to be stable';
    }

    // Default rationale based on position
    if (index === 0) {
      return 'Foundation task - establishes base requirements';
    } else if (index === total - 1) {
      return 'Final integration - completes the implementation';
    } else {
      return `Core functionality - builds on previous tasks and enables following features`;
    }
  }

  /**
   * Generate ASCII dependency diagram
   */
  private generateDependencyDiagram(subtasks: Subtask[], createdIssues: CreatedIssue[]): string {
    // Simple dependency diagram - can be enhanced based on actual dependencies
    const hasDatabase = createdIssues.some(issue => 
      issue.title.toLowerCase().includes('database') || 
      issue.title.toLowerCase().includes('model')
    );
    
    const hasAuth = createdIssues.some(issue => 
      issue.title.toLowerCase().includes('auth') || 
      issue.title.toLowerCase().includes('security')
    );
    
    const hasApi = createdIssues.some(issue => 
      issue.title.toLowerCase().includes('api') || 
      issue.title.toLowerCase().includes('endpoint')
    );
    
    const hasUI = createdIssues.some(issue => 
      issue.title.toLowerCase().includes('ui') || 
      issue.title.toLowerCase().includes('component')
    );

    if (hasDatabase && hasAuth && hasApi && hasUI) {
      return `Database Models ──→ API Endpoints ──→ UI Components ──→ Dashboard
      ↓                    ↓               ↓
Authentication ──→ Core Logic ──→ Advanced Features
      ↓                    ↓
Testing & QA ←─────────────┘`;
    } else {
      return `Foundation Tasks ──→ Core Implementation ──→ Integration
      ↓                    ↓               ↓
Quality Assurance ←─────────────────────┘`;
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
    /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/,
    /api\.github\.com\/repos\/([^/]+)\/([^/]+)\/issues\/(\d+)/
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