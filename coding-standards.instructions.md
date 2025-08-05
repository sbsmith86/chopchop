# ChopChop Coding Standards & Instructions

## Overview
This document outlines the coding standards and best practices for the ChopChop project - a browser-only React SPA that decomposes GitHub issues into actionable subtasks using AI assistance.

## Architecture Guidelines

### Frontend Framework
- **React**: Use functional components with hooks exclusively
- **TypeScript**: All code must be strongly typed
- **Tailwind CSS**: Use for all styling, follow utility-first approach
- **No Backend**: All logic and persistence is client-side only

### Component Structure
- Components should be in `/src/components/`
- Use PascalCase for component names
- Export components as named exports
- Each component should have a clear single responsibility

### State Management
- Use React Context for global state (`src/context/AppContext.tsx`)
- Use local state for component-specific data
- Prefer hooks for state logic

### API Integration
- OpenAI API integration via `src/utils/openai.ts`
- GitHub API integration via `src/utils/github.ts`
- All API keys stored locally, never exposed in logs or UI

## Code Quality Standards

### File Naming
- Use PascalCase for component files (e.g., `SubtaskListPanel.tsx`)
- Use camelCase for utility files (e.g., `openai.ts`)
- Use kebab-case for CSS files
- Use descriptive, meaningful names

### TypeScript Standards
- Always use explicit types for function parameters and return values
- Define interfaces in `src/types/index.ts`
- Avoid `any` type - use specific types or unions
- Use optional properties (`?`) appropriately

### Error Handling
- Always include try-catch blocks for async operations
- Provide meaningful error messages to users
- Log errors for debugging but never expose sensitive data
- Include fallback behavior when external services fail

### Security Guidelines
- Never expose API keys in console logs or UI
- Store configuration locally using browser storage
- Validate all user inputs
- Sanitize data before display

## Testing Approach
- Focus on user workflow testing
- Test error scenarios and fallbacks
- Validate API integration points
- Test offline/degraded functionality

## Performance Guidelines
- Use React.memo for expensive components
- Implement proper loading states
- Avoid unnecessary re-renders
- Optimize bundle size with dynamic imports

## UI/UX Standards
- Follow responsive design principles
- Use consistent spacing and colors from Tailwind
- Provide clear feedback for all user actions
- Include loading states for async operations
- Implement proper error boundaries

## Project-Specific Guidelines

### Task Generation
- All generated tasks should be atomic (completable in under 2 hours)
- Include specific acceptance criteria
- Add appropriate guardrails to prevent scope creep
- Follow dependency ordering

### Plan Management
- Plans should be editable and reviewable
- Support import/export functionality
- Maintain version history locally
- Include metadata for organization

### GitHub Integration
- Respect API rate limits
- Handle authentication gracefully
- Provide clear feedback on issue creation
- Support issue linking and references

## Development Workflow
1. Review existing code patterns before implementing new features
2. Follow the established component structure
3. Write TypeScript-first (no JavaScript files)
4. Test changes locally with real GitHub repos
5. Verify all error paths work correctly
6. Ensure responsive design on multiple screen sizes

## Dependencies Management
- Keep dependencies minimal and focused
- Prefer well-maintained packages
- Avoid dependencies that require a backend
- Document any new dependencies and their purpose

## Browser Compatibility
- Support modern browsers (Chrome, Firefox, Safari, Edge)
- Use standard Web APIs only
- Provide graceful degradation for unsupported features
- Test File System Access API fallbacks