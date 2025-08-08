# ChopChop - Universal Issue Decomposer SPA

ChopChop is a browser-only React SPA that decomposes GitHub issues into actionable subtasks using AI assistance. It integrates with GitHub and OpenAI APIs, features a 6-step workflow (Configuration → Issue Input → Clarification → Plan Review → Subtasks → Approval), and stores execution plans locally.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Environment Setup
- **Node.js v18+** required (currently running Node.js v20.19.4)
- **npm** v10+ (currently running npm v10.8.2) 
- **Git** for version control

### Bootstrap, Build, and Test the Repository

#### Install Dependencies
```bash
npm install
```
**Time:** ~55 seconds. NEVER CANCEL - dependency installation includes 424 packages and may show deprecation warnings which are expected.

#### Linting 
```bash
npm run lint
```
**Time:** ~2 seconds. Uses ESLint with flat config format. 
**Note:** Some existing lint errors are present in the codebase but do not prevent builds.

#### Build Production Bundle
```bash
npm run build
```
**Time:** ~5 seconds. NEVER CANCEL - Vite builds 836 modules and creates optimized production bundle in `dist/` directory. May show chunk size warnings (normal for this app).

#### Run Development Server
```bash
npm run dev
```
**Time:** ~200ms startup. NEVER CANCEL - Starts Vite dev server on `http://localhost:3000` (NOT the default 5173). Hot reloading enabled.
**Port Configuration:** Custom port 3000 configured in `vite.config.ts`.

#### Preview Production Build
```bash
npm run preview
```
**Time:** Instant startup. Serves production build on `http://localhost:4173` for testing.

## Validation and Testing

### Manual Application Testing
Since no automated test framework is set up, ALWAYS manually validate changes:

1. **Start development server:** `npm run dev`
2. **Navigate to:** `http://localhost:3000`
3. **Test core workflow scenarios:**
   - **Settings Configuration:** Click Settings button → verify config modal opens with GitHub PAT, repo, and OpenAI API key fields
   - **Mode Switching:** Test both "GitHub Issue URL" and "Markdown Content" input modes
   - **Plan Management:** Click "Plans (0)" button → verify plan manager interface
   - **UI Responsiveness:** Test responsive design across different viewport sizes

### Required Validation Steps
- **ALWAYS** run `npm run lint` before committing (fix critical errors, warnings acceptable)
- **ALWAYS** run `npm run build` to ensure production build succeeds  
- **ALWAYS** manually test the application UI after any component changes
- **ALWAYS** verify hot reloading works in development mode

## Project Structure and Technology Stack

### Core Technologies
- **Frontend:** React 18 with TypeScript
- **Build Tool:** Vite 5.4.19  
- **Styling:** Tailwind CSS with custom configuration
- **UI Components:** Custom components with @uiw/react-md-editor for markdown editing
- **Drag & Drop:** @dnd-kit for reordering subtasks
- **State Management:** React Context API

### Key Directories
```
src/
├── components/     # React components for each workflow step  
├── context/        # React Context for state management
├── types/          # TypeScript type definitions
├── utils/          # API clients and utility functions
└── App.tsx         # Main application component
```

### Configuration Files
- **`vite.config.ts`:** Build configuration (custom port 3000)
- **`tsconfig.json`:** TypeScript configuration with path mapping
- **`eslint.config.js`:** ESLint flat config format
- **`tailwind.config.ts`:** Tailwind CSS configuration
- **`package.json`:** Dependencies and npm scripts

## API Integration and External Dependencies

### Required API Keys (for functional testing)
- **GitHub Personal Access Token:** Requires `repo` permissions for private repos
- **OpenAI API Key:** For AI-powered issue decomposition
- **Storage:** Browser localStorage (no backend required)

### Network Requirements
- **GitHub API:** For fetching issues and creating subtasks
- **OpenAI API:** For generating clarification questions and execution plans
- **No Backend:** Completely client-side application

## Development Workflow

### Making Code Changes
1. **Start dev server:** `npm run dev` 
2. **Make changes** with hot reloading
3. **Lint code:** `npm run lint`
4. **Test manually** at `http://localhost:3000`
5. **Build production:** `npm run build`
6. **Verify build** with `npm run preview`

### Common Development Tasks

#### Modifying UI Components
- Components located in `src/components/`
- Uses Tailwind CSS classes
- Test responsive design and dark/light themes
- Verify markdown rendering works correctly

#### Adding New Features
- Update TypeScript types in `src/types/`
- Implement API calls in `src/utils/`
- Update React Context in `src/context/` for state management
- Add UI components following existing patterns

#### Fixing Linting Issues
- Run `eslint . --fix` to auto-fix simple issues
- Address TypeScript strict mode errors
- Follow existing code patterns for consistency

## Troubleshooting

### Common Issues
**Port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
# Or use different port: npm run dev -- --port 3001
```

**Build failures after dependency changes:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Linting errors blocking development:**
- Fix critical TypeScript errors first
- Warnings are acceptable for builds to succeed
- Use `// @ts-ignore` sparingly for temporary fixes

### Browser-Specific Issues
- **File System Access API:** Not universally supported, app falls back to download/upload
- **localStorage:** Required for plan persistence
- **CORS:** No issues since all APIs called from browser

## Performance and Build Optimization

### Build Output Analysis
- **Bundle Size:** ~1.3MB main chunk (normal for React + dependencies)
- **Source Maps:** Enabled in production for debugging
- **Code Splitting:** Consider dynamic imports for large features

### Development Performance
- **Hot Reload:** ~200ms for component updates
- **Build Time:** ~5 seconds for full production build
- **Linting:** ~2 seconds for full codebase scan

## Security Considerations

### API Key Management
- **GitHub PAT:** Stored in browser localStorage only
- **OpenAI Key:** Never exposed in console logs or network requests
- **No Server:** All sensitive data remains client-side

### Content Security
- **No Backend:** Eliminates server-side attack vectors
- **Local Storage:** Data never transmitted to external servers
- **API Calls:** Only to GitHub and OpenAI official endpoints

## Key Files Reference

### Frequently Modified Files
- **`src/App.tsx`:** Main application entry point
- **`src/components/AppShell.tsx`:** Layout and navigation
- **`src/context/AppContext.tsx`:** Global state management
- **`src/utils/github.ts`:** GitHub API integration
- **`src/utils/openai.ts`:** OpenAI API integration

### Configuration Files to Review
- **`package.json`:** Scripts and dependencies
- **`vite.config.ts`:** Build and development server settings
- **`tailwind.config.ts`:** Styling configuration
- **`tsconfig.json`:** TypeScript compiler options

## Command Reference

```bash
# Development
npm install                    # Install dependencies (~55 seconds)
npm run dev                   # Start dev server on port 3000 (~200ms)
npm run build                 # Build production bundle (~5 seconds)  
npm run preview               # Preview production build on port 4173
npm run lint                  # Run ESLint (~2 seconds)

# Troubleshooting
rm -rf node_modules package-lock.json && npm install  # Clean reinstall
lsof -ti:3000 | xargs kill -9                        # Kill port 3000 process
```

## Important Notes

- **NEVER CANCEL** long-running commands - builds may take up to 5+ seconds
- **Port 3000** is configured (not Vite's default 5173)
- **No testing framework** is currently set up - rely on manual testing
- **ESLint warnings** are acceptable - focus on fixing errors
- **Browser compatibility** requires modern browsers for File System Access API
- **Local development only** - no deployment pipeline configured