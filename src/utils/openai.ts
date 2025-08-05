import { ClarificationQuestion, GitHubIssue, ExecutionPlan, Subtask, PlanStep } from '../types';

/**
 * OpenAI API client for generating plans and questions
 */
export class OpenAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate clarification questions for an issue using OpenAI
   */
  async generateClarificationQuestions(issue: { issueTitle: string; issueBody: string; additionalContext?: string }): Promise<string[]> {
    try {
      const prompt = this.buildClarificationPrompt(issue);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software project manager who helps break down complex issues into actionable tasks. Generate specific clarification questions that will help identify missing requirements, scope boundaries, and implementation details.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      const questions = this.parseQuestionsFromResponse(content);

      if (questions.length === 0) {
        throw new Error('No valid questions extracted from OpenAI response');
      }

      return questions.slice(0, 5);

    } catch (error) {
      console.warn('OpenAI API call failed, falling back to generic questions:', error);
      return this.getFallbackQuestions(issue);
    }
  }

  /**
   * Generate execution plan from issue and clarifications using OpenAI
   */
  async generateExecutionPlan(issue: GitHubIssue, questions: ClarificationQuestion[]): Promise<ExecutionPlan> {
    try {
      const prompt = this.buildPlanPrompt(issue, questions);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software architect and project manager. Create detailed, actionable execution plans that can be broken down into specific development tasks. Focus on practical implementation steps, not just high-level planning.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No execution plan content received from OpenAI API');
      }

      const steps = this.parsePlanSteps(content);

      return {
        id: Date.now().toString(),
        title: `Execution Plan: ${issue.title}`,
        description: `AI-generated plan based on issue analysis and clarifications`,
        content: content.trim(),
        steps,
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      console.warn('OpenAI execution plan generation failed, falling back to template:', error);
      return this.getFallbackPlan(issue, questions);
    }
  }

  /**
   * Generate subtasks from execution plan using OpenAI
   */
  async generateSubtasks(plan: ExecutionPlan): Promise<Subtask[]> {
    try {
      const prompt = this.buildSubtaskPrompt(plan);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(20000), // 20 second timeout for longer response
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software engineer and project manager. Break down execution plans into atomic, actionable subtasks that can each be completed in under 2 hours. Each subtask should affect only a single component or file. Include specific acceptance criteria and guardrails for each task.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No subtask content received from OpenAI API');
      }

      // Parse the subtasks from the response
      const parsedSubtasks = this.parseSubtasksFromResponse(content);

      if (parsedSubtasks.length === 0) {
        throw new Error('No valid subtasks extracted from OpenAI response');
      }

      // Add IDs, order, and apply "too big" detection
      const subtasks = parsedSubtasks.map((task, index) => ({
        id: `subtask-${Date.now()}-${index}`,
        order: index,
        isTooBig: this.detectTooBigTask(task),
        ...task
      }));

      return subtasks;

    } catch (error) {
      console.warn('OpenAI subtask generation failed, falling back to template:', error);
      return this.getFallbackSubtasks();
    }
  }

  /**
   * Split a large subtask into smaller ones using OpenAI
   */
  async splitSubtask(subtask: Subtask): Promise<Omit<Subtask, 'id' | 'order'>[]> {
    try {
      const prompt = this.buildSplitPrompt(subtask);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software engineer. Split large tasks into smaller, atomic tasks that can each be completed in under 2 hours. Each split task should be independently completable and affect only a single component or file.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No split content received from OpenAI API');
      }

      return this.parseSplitResponse(content, subtask);

    } catch (error) {
      console.warn('OpenAI split failed, using fallback:', error);
      return this.getFallbackSplit(subtask);
    }
  }

  // PRIVATE HELPER METHODS

  private buildClarificationPrompt(issue: { issueTitle: string; issueBody: string; additionalContext?: string }): string {
    return `Analyze this GitHub issue and generate 3-5 specific clarification questions that would help break it down into actionable subtasks.

**Issue Title:** ${issue.issueTitle}

**Issue Description:**
${issue.issueBody || 'No description provided'}

${issue.additionalContext ? `**Additional Context:**
${issue.additionalContext}

` : ''}**Instructions:**
- Focus on identifying unclear requirements, missing technical details, and scope boundaries
- Ask about dependencies, constraints, and acceptance criteria that aren't well defined
- Consider user experience, interface specifics, and implementation approaches
- Make questions specific to THIS issue, not generic project management questions
- Each question should help clarify something that would affect how the work is broken down
${issue.additionalContext ? '- Take into account the additional context provided when forming questions' : ''}

**Format:** Return only the questions, one per line, ending with a question mark.

**Questions:**`;
  }

  private parseQuestionsFromResponse(content: string): string[] {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        const cleaned = line.replace(/^[\d\-*•\s]+/, '').trim();
        return cleaned.endsWith('?') && cleaned.length > 10 && cleaned.length < 200;
      })
      .map(line => line.replace(/^[\d\-*•\s]+/, '').trim())
      .filter((question, index, array) => array.indexOf(question) === index);
  }

  private getFallbackQuestions(issue: { issueTitle: string; issueBody: string; additionalContext?: string }): string[] {
    const baseQuestions = [
      'What are the specific technical requirements for this feature?',
      'Are there any dependencies or constraints that should be considered?',
      'What should the acceptance criteria include for this to be complete?',
      'Who are the primary users or stakeholders for this change?',
      'What is the expected timeline or priority for this work?'
    ];

    const title = issue.issueTitle.toLowerCase();
    const body = (issue.issueBody || '').toLowerCase();
    const additionalContext = (issue.additionalContext || '').toLowerCase();
    const content = `${title} ${body} ${additionalContext}`;

    const contextQuestions: string[] = [];

    if (content.includes('api') || content.includes('endpoint')) {
      contextQuestions.push('What API endpoints or integrations are required?');
    }

    if (content.includes('ui') || content.includes('interface') || content.includes('frontend')) {
      contextQuestions.push('What are the specific UI/UX requirements?');
    }

    if (content.includes('database') || content.includes('data') || content.includes('storage')) {
      contextQuestions.push('What are the data storage and retrieval requirements?');
    }

    if (content.includes('security') || content.includes('auth') || content.includes('permission')) {
      contextQuestions.push('What security or authentication considerations are needed?');
    }

    return [...contextQuestions, ...baseQuestions].slice(0, 5);
  }

  private buildPlanPrompt(issue: GitHubIssue, questions: ClarificationQuestion[]): string {
    const answeredQuestions = questions
      .filter(q => q.answer && q.answer.trim().length > 0)
      .map(q => `**Q: ${q.question}**\nA: ${q.answer}`)
      .join('\n\n');

    return `Create a detailed execution plan for implementing this GitHub issue. The plan should be practical, actionable, and suitable for breaking down into specific development tasks.

**ISSUE DETAILS:**
**Title:** ${issue.title}
**Description:**
${issue.body || 'No description provided'}

${issue.additionalContext ? `**Additional Context:**
${issue.additionalContext}

` : ''}**CLARIFICATIONS PROVIDED:**
${answeredQuestions || 'No clarifications provided'}

**REQUIREMENTS:**
- Create a structured, step-by-step execution plan
- Focus on practical implementation phases (setup, development, testing, deployment)
- Include specific technical considerations based on the issue content
- Consider the clarifications provided when planning implementation approach
${issue.additionalContext ? '- Take into account the additional context provided when planning the implementation' : ''}
- Make each step actionable and measurable
- Include acceptance criteria for each major phase
- Consider dependencies, risks, and prerequisites

**FORMAT:**
Use markdown with the following structure:
# Execution Plan: [Issue Title]

## Overview
Brief summary of what will be implemented and why

## Prerequisites
- Any setup, dependencies, or preparation needed

## Implementation Phases

### Phase 1: [Name]
**Objective:** Clear goal for this phase
**Tasks:**
- Specific actionable tasks
- Each task should be clear and measurable

**Acceptance Criteria:**
- What defines completion of this phase
- Measurable outcomes

### Phase 2: [Name]
[Continue pattern...]

## Testing Strategy
How the implementation will be validated

## Deployment Considerations
How the changes will be deployed and monitored

## Success Criteria
Overall measures of successful completion

Generate a plan that's specific to THIS issue and the provided clarifications.`;
  }

  private parsePlanSteps(content: string): PlanStep[] {
    const steps: PlanStep[] = [];
    const lines = content.split('\n');
    let currentStep: Partial<PlanStep> | null = null;
    let stepOrder = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.match(/^#{2,4}\s+(Phase|Step)\s+\d+/i) || line.match(/^#{2,4}\s+\d+\./)) {
        if (currentStep && currentStep.title) {
          steps.push({
            id: `step-${stepOrder}`,
            title: currentStep.title,
            description: currentStep.description || '',
            order: stepOrder,
            subtasks: []
          });
        }

        stepOrder++;
        const title = line.replace(/^#{2,4}\s+/, '').replace(/^\d+\.\s*/, '').trim();
        currentStep = {
          title,
          description: '',
          order: stepOrder
        };
      }
      else if (currentStep && line.length > 0 && !line.startsWith('#')) {
        if (currentStep.description) {
          currentStep.description += '\n' + line;
        } else {
          currentStep.description = line;
        }
      }
    }

    if (currentStep && currentStep.title) {
      steps.push({
        id: `step-${stepOrder}`,
        title: currentStep.title,
        description: currentStep.description || '',
        order: stepOrder,
        subtasks: []
      });
    }

    return steps;
  }

  private getFallbackPlan(issue: GitHubIssue, questions: ClarificationQuestion[]): ExecutionPlan {
    const answeredQuestions = questions
      .filter(q => q.answer && q.answer.trim().length > 0)
      .map(q => `- **${q.question}** ${q.answer}`)
      .join('\n');

    const content = `# Execution Plan: ${issue.title}

## Overview
Implementation plan for: ${issue.title}

${issue.body}

${issue.additionalContext ? `## Additional Context
${issue.additionalContext}

` : ''}## Clarifications Provided
${answeredQuestions || 'No additional clarifications provided'}

## Implementation Phases

### Phase 1: Analysis & Setup
**Objective:** Prepare development environment and analyze requirements
**Tasks:**
- Review all requirements and constraints
- Set up development environment
- Identify dependencies and potential blockers
- Create technical specifications

**Acceptance Criteria:**
- Development environment is configured
- Requirements are clearly documented
- Dependencies are identified and available

### Phase 2: Core Implementation
**Objective:** Implement the main functionality
**Tasks:**
- Implement core features according to specifications
- Add error handling and validation
- Follow coding standards and best practices
- Create unit tests for new functionality

**Acceptance Criteria:**
- Core functionality is implemented and working
- Code passes all tests
- Code follows team standards

### Phase 3: Integration & Testing
**Objective:** Ensure the implementation works within the larger system
**Tasks:**
- Integrate with existing systems/APIs
- Perform integration testing
- Conduct user acceptance testing
- Fix any identified issues

**Acceptance Criteria:**
- Integration is successful
- All tests pass
- User acceptance criteria are met

### Phase 4: Documentation & Deployment
**Objective:** Prepare for production deployment
**Tasks:**
- Complete documentation
- Prepare deployment scripts
- Deploy to staging environment
- Deploy to production with monitoring

**Acceptance Criteria:**
- Documentation is complete and accurate
- Deployment is successful
- Monitoring confirms system stability

## Testing Strategy
- Unit tests for all new functionality
- Integration tests for system interactions
- User acceptance testing with stakeholders
- Performance testing if applicable

## Success Criteria
- All acceptance criteria are met
- Code is deployed successfully to production
- Feature works as expected in live environment
- Documentation is complete`;

    return {
      id: Date.now().toString(),
      title: `Execution Plan: ${issue.title}`,
      description: 'Fallback execution plan template',
      content,
      steps: [
        {
          id: 'step-1',
          title: 'Analysis & Setup',
          description: 'Prepare development environment and analyze requirements',
          order: 1,
          subtasks: []
        },
        {
          id: 'step-2',
          title: 'Core Implementation',
          description: 'Implement the main functionality',
          order: 2,
          subtasks: []
        },
        {
          id: 'step-3',
          title: 'Integration & Testing',
          description: 'Ensure the implementation works within the larger system',
          order: 3,
          subtasks: []
        },
        {
          id: 'step-4',
          title: 'Documentation & Deployment',
          description: 'Prepare for production deployment',
          order: 4,
          subtasks: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Builds prompt for subtask generation with dependency analysis
   */
  private buildSubtaskPrompt(plan: ExecutionPlan): string {
    return `Break down this execution plan into atomic, actionable subtasks with proper dependency ordering. Each subtask should be completable in under 2 hours and affect only a single component or file.

**EXECUTION PLAN:**
${plan.content}

**DEPENDENCY ORDERING REQUIREMENTS:**
- Analyze what each task needs from previous tasks to succeed
- Order tasks so dependencies are always completed first
- Foundation/setup tasks must come before implementation tasks
- Testing tasks must come after their implementation tasks
- Documentation tasks should come after implementation is stable

**REQUIREMENTS FOR EACH SUBTASK:**
- Title: Clear, specific action (e.g., "Create UserService class with email validation")
- Description: Detailed explanation of what needs to be done
- Acceptance Criteria: 3-5 specific, measurable outcomes that define completion
- Guardrails: 2-4 rules to prevent scope creep or breaking existing functionality
- Estimated Hours: Realistic time estimate (1-8 hours, prefer 1-4)
- Tags: 2-3 relevant tags for categorization
- DependsOn: List of prerequisite task titles (what must be done first)
- PrerequisiteTaskIds: Will be populated after ordering

**ATOMICITY RULES:**
- Each task should have ONE primary action
- Avoid tasks with "and", "or", or multiple objectives
- If a task affects multiple files/components, split it
- Testing tasks should be separate from implementation tasks
- Documentation tasks should be separate from coding tasks

**DEPENDENCY ANALYSIS:**
- Database/model changes come before API changes
- API endpoints come before frontend integration
- Core utilities come before features that use them
- Authentication/security comes before features that need it
- Configuration/setup comes before anything that depends on it

**FORMAT:**
Return ONLY a JSON array of subtasks in dependency order:

[
  {
    "title": "Task title here",
    "description": "Detailed description of the task",
    "acceptanceCriteria": [
      "Specific outcome 1",
      "Specific outcome 2",
      "Specific outcome 3"
    ],
    "guardrails": [
      "Don't modify existing API endpoints",
      "Follow existing code patterns",
      "Write unit tests for new functions"
    ],
    "estimatedHours": 3,
    "tags": ["implementation", "backend"],
    "dependsOn": ["Previous task title if any"]
  }
]

Generate 5-15 subtasks that cover the entire execution plan in proper dependency order.`;
  }

  /**
   * Parses subtasks from OpenAI JSON response
   */
  private parseSubtasksFromResponse(content: string): Omit<Subtask, 'id' | 'order' | 'isTooBig'>[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const jsonString = jsonMatch[0];
      const parsedTasks = JSON.parse(jsonString);

      if (!Array.isArray(parsedTasks)) {
        throw new Error('Response is not an array');
      }

      // Validate and clean the parsed tasks
      return parsedTasks.map((task, index) => {
        if (!task.title || !task.description) {
          throw new Error(`Task ${index} missing required fields`);
        }

        return {
          title: String(task.title).trim(),
          description: String(task.description).trim(),
          acceptanceCriteria: Array.isArray(task.acceptanceCriteria)
            ? task.acceptanceCriteria.map(c => String(c).trim()).filter(c => c.length > 0)
            : ['Task completed successfully'],
          guardrails: Array.isArray(task.guardrails)
            ? task.guardrails.map(g => String(g).trim()).filter(g => g.length > 0)
            : ['Follow existing code patterns', 'Write appropriate tests'],
          estimatedHours: Math.min(Math.max(Number(task.estimatedHours) || 2, 1), 8),
          tags: Array.isArray(task.tags)
            ? task.tags.map(t => String(t).trim()).filter(t => t.length > 0)
            : ['general']
        };
      });

    } catch (error) {
      console.warn('Failed to parse JSON response, attempting fallback parsing:', error);
      return this.parseFallbackSubtasks(content);
    }
  }

  /**
   * Fallback parsing when JSON parsing fails
   */
  private parseFallbackSubtasks(content: string): Omit<Subtask, 'id' | 'order' | 'isTooBig'>[] {
    const tasks: Omit<Subtask, 'id' | 'order' | 'isTooBig'>[] = [];
    const lines = content.split('\n');
    let currentTask: Partial<Omit<Subtask, 'id' | 'order' | 'isTooBig'>> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect task titles (numbered or bulleted)
      if (trimmed.match(/^[\d\-*]\s*\.?\s*[A-Z]/)) {
        // Save previous task
        if (currentTask && currentTask.title) {
          tasks.push({
            title: currentTask.title,
            description: currentTask.description || currentTask.title,
            acceptanceCriteria: currentTask.acceptanceCriteria || ['Task completed successfully'],
            guardrails: currentTask.guardrails || ['Follow existing patterns'],
            estimatedHours: currentTask.estimatedHours || 2,
            tags: currentTask.tags || ['general']
          });
        }

        // Start new task
        const title = trimmed.replace(/^[\d\-*]\s*\.?\s*/, '');
        currentTask = {
          title,
          description: title,
          acceptanceCriteria: ['Task completed successfully'],
          guardrails: ['Follow existing patterns'],
          estimatedHours: 2,
          tags: ['general']
        };
      }
    }

    // Don't forget the last task
    if (currentTask && currentTask.title) {
      tasks.push({
        title: currentTask.title,
        description: currentTask.description || currentTask.title,
        acceptanceCriteria: currentTask.acceptanceCriteria || ['Task completed successfully'],
        guardrails: currentTask.guardrails || ['Follow existing patterns'],
        estimatedHours: currentTask.estimatedHours || 2,
        tags: currentTask.tags || ['general']
      });
    }

    return tasks;
  }

  /**
   * Detects if a task is "too big" based on TDD criteria
   */
  private detectTooBigTask(task: Omit<Subtask, 'id' | 'order' | 'isTooBig'>): boolean {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    const content = `${title} ${description}`;

    // Check for multiple actions/resources
    const multipleActionWords = [' and ', ' or ', ' then ', ' also ', ' plus '];
    const hasMultipleActions = multipleActionWords.some(word => content.includes(word));

    // Check for high time estimate
    const isHighEffort = task.estimatedHours > 4;

    // Check for broad scope indicators
    const broadScopeWords = ['entire', 'all', 'complete', 'full', 'comprehensive', 'multiple'];
    const hasBroadScope = broadScopeWords.some(word => content.includes(word));

    // Check for multiple component mentions
    const componentWords = ['component', 'service', 'controller', 'model', 'view', 'api', 'endpoint'];
    const componentCount = componentWords.filter(word => content.includes(word)).length;
    const affectsMultipleComponents = componentCount > 1;

    return hasMultipleActions || isHighEffort || hasBroadScope || affectsMultipleComponents;
  }

  /**
   * Provides fallback subtasks when API fails
   */
  private getFallbackSubtasks(): Subtask[] {
    const baseSubtasks = [
      {
        title: 'Set up development environment',
        description: 'Configure local development environment with necessary tools and dependencies',
        acceptanceCriteria: [
          'Development environment is configured',
          'All dependencies are installed',
          'Project builds successfully'
        ],
        guardrails: [
          'Use version-controlled configuration',
          'Document setup process',
          'Test environment setup on clean machine'
        ],
        estimatedHours: 2,
        tags: ['setup', 'environment']
      },
      {
        title: 'Create core data models',
        description: 'Define and implement the primary data structures needed for the feature',
        acceptanceCriteria: [
          'Data models are defined and documented',
          'Models include necessary validation',
          'Database migrations are created if needed'
        ],
        guardrails: [
          'Follow existing model patterns',
          'Add appropriate indexes',
          'Include data validation rules'
        ],
        estimatedHours: 3,
        tags: ['backend', 'data']
      },
      {
        title: 'Implement business logic',
        description: 'Build the core functionality according to requirements',
        acceptanceCriteria: [
          'Core features are implemented',
          'Business rules are enforced',
          'Error handling is in place'
        ],
        guardrails: [
          'Write unit tests for all business logic',
          'Follow SOLID principles',
          'Handle edge cases appropriately'
        ],
        estimatedHours: 6,
        isTooBig: true,
        tags: ['implementation', 'core']
      },
      {
        title: 'Create API endpoints',
        description: 'Implement REST API endpoints for the new functionality',
        acceptanceCriteria: [
          'API endpoints are implemented',
          'Request/response validation is in place',
          'API documentation is updated'
        ],
        guardrails: [
          'Follow existing API conventions',
          'Include proper status codes',
          'Add rate limiting if needed'
        ],
        estimatedHours: 4,
        tags: ['api', 'backend']
      },
      {
        title: 'Add comprehensive testing',
        description: 'Create unit and integration tests for all new functionality',
        acceptanceCriteria: [
          'Unit tests cover all functions',
          'Integration tests verify workflows',
          'Test coverage is above 80%'
        ],
        guardrails: [
          'Use existing test patterns',
          'Include both positive and negative test cases',
          'Mock external dependencies'
        ],
        estimatedHours: 4,
        tags: ['testing', 'quality']
      }
    ];

    // Add IDs and order to base subtasks
    return baseSubtasks.map((task, index) => ({
      id: `fallback-${Date.now()}-${index}`,
      order: index,
      isTooBig: task.isTooBig || false,
      ...task
    }));
  }

  /**
   * Build prompt for task splitting
   */
  private buildSplitPrompt(subtask: Subtask): string {
    return `Split this large task into 2-4 smaller, atomic tasks. Each task should be completable in under 2 hours and affect only a single component or file.

**ORIGINAL TASK:**
Title: ${subtask.title}
Description: ${subtask.description}
Estimated Hours: ${subtask.estimatedHours}
Current Acceptance Criteria: ${subtask.acceptanceCriteria.join(', ')}

**SPLITTING REQUIREMENTS:**
- Create 2-4 smaller tasks that together accomplish the original task
- Each task should be independently completable
- Each task should affect only one component/file
- Total estimated hours should not exceed original (${subtask.estimatedHours}h)
- Maintain logical sequence and dependencies
- Preserve the original guardrails for each split task

**FORMAT:**
Return ONLY a JSON array of split tasks:

[
  {
    "title": "Specific task title",
    "description": "Detailed description",
    "acceptanceCriteria": ["criteria 1", "criteria 2"],
    "estimatedHours": 2
  }
]

Split the task now:`;
  }

  /**
   * Parse split response from OpenAI
   */
  private parseSplitResponse(content: string, originalTask: Subtask): Omit<Subtask, 'id' | 'order'>[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found');
      }

      const splitTasks = JSON.parse(jsonMatch[0]);

      return splitTasks.map((task: unknown) => {
        const taskObj = task as Record<string, unknown>;
        return {
          title: String(taskObj.title || '').trim(),
          description: String(taskObj.description || '').trim(),
          acceptanceCriteria: Array.isArray(taskObj.acceptanceCriteria)
            ? (taskObj.acceptanceCriteria as unknown[]).map((c: unknown) => String(c).trim())
            : ['Task completed successfully'],
          guardrails: originalTask.guardrails, // Inherit original guardrails
          estimatedHours: Math.min(Math.max(Number(taskObj.estimatedHours) || 1, 1), 4),
          isTooBig: false, // Split tasks should not be too big
          tags: originalTask.tags, // Inherit original tags
          dependsOn: originalTask.dependsOn, // Inherit dependencies
          prerequisiteTaskIds: originalTask.prerequisiteTaskIds
        };
      });

    } catch (error) {
      console.warn('Failed to parse split response:', error);
      return this.getFallbackSplit(originalTask);
    }
  }

  /**
   * Fallback split when AI fails
   */
  private getFallbackSplit(originalTask: Subtask): Omit<Subtask, 'id' | 'order'>[] {
    const halfHours = Math.ceil(originalTask.estimatedHours / 2);
    const halfCriteria = Math.ceil(originalTask.acceptanceCriteria.length / 2);

    return [
      {
        title: `${originalTask.title} - Setup & Foundation`,
        description: `Initial setup and foundation work for: ${originalTask.description}`,
        acceptanceCriteria: originalTask.acceptanceCriteria.slice(0, halfCriteria),
        guardrails: originalTask.guardrails,
        estimatedHours: halfHours,
        isTooBig: false,
        tags: [...originalTask.tags, 'setup'],
        dependsOn: originalTask.dependsOn,
        prerequisiteTaskIds: originalTask.prerequisiteTaskIds
      },
      {
        title: `${originalTask.title} - Implementation & Testing`,
        description: `Complete implementation and testing for: ${originalTask.description}`,
        acceptanceCriteria: originalTask.acceptanceCriteria.slice(halfCriteria),
        guardrails: originalTask.guardrails,
        estimatedHours: originalTask.estimatedHours - halfHours,
        isTooBig: false,
        tags: [...originalTask.tags, 'implementation'],
        dependsOn: originalTask.dependsOn,
        prerequisiteTaskIds: originalTask.prerequisiteTaskIds
      }
    ];
  }
}

// STANDALONE FUNCTIONS

/**
 * Generate clarification questions (standalone function)
 */
export async function generateClarificationQuestions(
  config: { apiKey: string },
  issue: { issueTitle: string; issueBody: string; additionalContext?: string }
): Promise<string[]> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!issue.issueTitle && !issue.issueBody) {
    throw new Error('Issue title or body is required');
  }

  const client = new OpenAIClient(config.apiKey);
  return client.generateClarificationQuestions(issue);
}

/**
 * Generate execution plan (standalone function)
 */
export async function generateExecutionPlan(
  config: { apiKey: string },
  issue: GitHubIssue,
  questions: ClarificationQuestion[]
): Promise<ExecutionPlan> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!issue.title && !issue.body) {
    throw new Error('Issue data is required');
  }

  const client = new OpenAIClient(config.apiKey);
  return client.generateExecutionPlan(issue, questions);
}

/**
 * Generate subtasks from execution plan (standalone function)
 */
export async function generateSubtasks(
  config: { apiKey: string },
  plan: ExecutionPlan
): Promise<Subtask[]> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!plan.content) {
    throw new Error('Execution plan content is required');
  }

  const client = new OpenAIClient(config.apiKey);
  return client.generateSubtasks(plan);
}

/**
 * Split a large subtask into smaller ones (standalone function)
 */
export async function splitSubtask(
  config: { apiKey: string },
  subtask: Subtask
): Promise<Omit<Subtask, 'id' | 'order'>[]> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const client = new OpenAIClient(config.apiKey);
  return client.splitSubtask(subtask);
}