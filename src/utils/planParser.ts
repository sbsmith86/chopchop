import { PlanStep } from '../types';

/**
 * Utility functions for parsing and managing plan content
 */

/**
 * Parse markdown content into structured plan steps
 */
export function parseMarkdownToPlanSteps(content: string): PlanStep[] {
  const lines = content.split('\n');
  const steps: PlanStep[] = [];
  let currentStep: Partial<PlanStep> | null = null;
  let stepOrder = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for headers that indicate new steps (## or ### level)
    if (trimmedLine.match(/^#{2,3}\s+/)) {
      // Save previous step if exists
      if (currentStep && currentStep.title) {
        steps.push({
          id: `step-${stepOrder}`,
          title: currentStep.title,
          description: currentStep.description || '',
          order: stepOrder,
          subtasks: [],
          isGroupedUnit: false,
          allowSplit: false
        });
      }

      stepOrder++;
      const title = trimmedLine.replace(/^#{2,3}\s+/, '').replace(/^\d+\.\s*/, '').trim();
      currentStep = {
        title,
        description: '',
        order: stepOrder
      };
    }
    // Collect content for current step description
    else if (currentStep && trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
      if (currentStep.description) {
        currentStep.description += '\n' + trimmedLine;
      } else {
        currentStep.description = trimmedLine;
      }
    }
  }

  // Add the last step
  if (currentStep && currentStep.title) {
    steps.push({
      id: `step-${stepOrder}`,
      title: currentStep.title,
      description: currentStep.description || '',
      order: stepOrder,
      subtasks: [],
      isGroupedUnit: false,
      allowSplit: false
    });
  }

  return steps;
}

/**
 * Convert plan steps back to markdown content
 */
export function planStepsToMarkdown(steps: PlanStep[], originalContent: string): string {
  if (steps.length === 0) {
    return originalContent;
  }

  // Get the intro content (everything before the first step)
  const lines = originalContent.split('\n');
  const introLines: string[] = [];
  let foundFirstStep = false;

  for (const line of lines) {
    if (line.trim().match(/^#{2,3}\s+/) && !foundFirstStep) {
      foundFirstStep = true;
      break;
    }
    if (!foundFirstStep) {
      introLines.push(line);
    }
  }

  // Build the new content
  const newContent = [
    ...introLines,
    '',
    ...steps.map(step => {
      const stepHeader = `## ${step.title}`;
      const stepContent = step.description ? step.description.trim() : '';
      
      // Add metadata comments if step has special properties
      const metadata: string[] = [];
      if (step.isGroupedUnit) {
        metadata.push('<!-- GROUPED_UNIT: Keep as single subtask -->');
      }
      if (step.allowSplit) {
        metadata.push('<!-- ALLOW_SPLIT: Override too big warnings -->');
      }
      
      return [
        stepHeader,
        ...metadata,
        stepContent ? stepContent : '',
        ''
      ].filter(Boolean).join('\n');
    }).join('\n\n')
  ].join('\n');

  return newContent.trim();
}

/**
 * Parse metadata comments from step content to restore properties
 */
export function parseStepMetadata(content: string): { isGroupedUnit: boolean; allowSplit: boolean } {
  const isGroupedUnit = content.includes('<!-- GROUPED_UNIT:');
  const allowSplit = content.includes('<!-- ALLOW_SPLIT:');
  
  return { isGroupedUnit, allowSplit };
}

/**
 * Update plan steps with metadata from content
 */
export function enrichStepsWithMetadata(steps: PlanStep[], content: string): PlanStep[] {
  // Simple implementation - in a real app you might want more sophisticated parsing
  return steps.map(step => {
    const metadata = parseStepMetadata(content);
    return {
      ...step,
      isGroupedUnit: metadata.isGroupedUnit,
      allowSplit: metadata.allowSplit
    };
  });
}