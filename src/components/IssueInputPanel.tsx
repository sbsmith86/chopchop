import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchGitHubIssue, parseGitHubIssueUrl } from '../utils/github';
import { GitHubIssue } from '../types';

/**
 * Panel for inputting GitHub issue URL or markdown content
 */
export const IssueInputPanel: React.FC = () => {
  const { state, setError, setLoading, nextStep, dispatch } = useAppContext();
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'markdown'>('url');
  const [issueProcessed, setIssueProcessed] = useState(false);

  // Add debug logging for step tracking
  console.log('IssueInputPanel rendered - currentStep:', state.currentStep);

  // Fix: Call nextStep only after issue is successfully set in state
  React.useEffect(() => {
    if (issueProcessed && state.issue) {
      console.log('Issue successfully set, proceeding to next step. CurrentStep:', state.currentStep);
      setIssueProcessed(false); // Reset flag
      nextStep();
    }
  }, [state.issue, issueProcessed, nextStep, state.currentStep]);

  /**
   * Validates configuration before processing
   */
  const validateConfig = (): boolean => {
    if (!state.config.githubPat) {
      setError('GitHub Personal Access Token is required. Please configure it in settings.');
      return false;
    }

    if (inputType === 'url' && !state.config.githubRepo) {
      setError('Default repository is required for URL input. Please configure it in settings.');
      return false;
    }

    return true;
  };

  /**
   * Handles issue submission with proper error handling
   */
  const handleSubmit = async (): Promise<void> => {
    if (!input.trim()) {
      setError('Please provide an issue URL or markdown content');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (inputType === 'url') {
        if (!validateConfig()) {
          setLoading(false);
          return;
        }

        // Validate URL format before making API call
        const parsedUrl = parseGitHubIssueUrl(input.trim());
        if (!parsedUrl) {
          throw new Error('Invalid GitHub issue URL format. Expected: https://github.com/owner/repo/issues/123');
        }

        // Fetch the issue with proper error handling
        const githubIssue = await fetchGitHubIssue(
          {
            pat: state.config.githubPat!,
            repo: state.config.githubRepo!
          },
          input.trim()
        );

        const issue: GitHubIssue = {
          id: githubIssue.number?.toString() || Date.now().toString(),
          title: githubIssue.title,
          body: githubIssue.body || '',
          url: githubIssue.url,
          number: githubIssue.number,
          repository: state.config.githubRepo
        };

        dispatch({ type: 'SET_ISSUE', payload: issue });
      } else {
        // Handle markdown input
        const issue: GitHubIssue = {
          id: Date.now().toString(),
          title: 'Manual Input',
          body: input.trim(),
          repository: state.config.githubRepo
        };

        dispatch({ type: 'SET_ISSUE', payload: issue });
      }

      // Set flag to trigger nextStep after state update
      setIssueProcessed(true);
    } catch (error) {
      console.error('Failed to process issue input:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process issue input';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Start New Decomposition</h2>
          <p className="text-gray-600 mt-2">
            Enter a GitHub issue URL or paste markdown content to begin breaking it down into actionable tasks.
          </p>
        </div>

        {/* Input type selection */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInputType('url')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                inputType === 'url'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              GitHub Issue URL
            </button>
            <button
              onClick={() => setInputType('markdown')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                inputType === 'markdown'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Markdown Content
            </button>
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              inputType === 'url'
                ? 'https://github.com/owner/repository/issues/123'
                : 'Paste your issue content in markdown format...'
            }
            rows={12}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical font-mono text-sm"
          />

          {inputType === 'url' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">For private repositories:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Ensure your GitHub PAT has <code className="bg-amber-100 px-1 rounded">repo</code> permissions</li>
                <li>• The token must have access to the specific repository</li>
                <li>• Organization repos may require <code className="bg-amber-100 px-1 rounded">read:org</code> permissions</li>
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || state.isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                Processing...
              </>
            ) : (
              `${inputType === 'url' ? 'Fetch & Process Issue' : 'Process Issue'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};