import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { GitHubIssue } from '../types';
import { GitHubClient } from '../utils/github';

/**
 * Issue input panel for GitHub URLs or markdown content
 */
export default function IssueInputPanel() {
  const { state, setIssue, setStep, setError, setLoading } = useAppContext();
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'markdown'>('url');

  /**
   * Parse GitHub issue URL
   */
  const parseGitHubUrl = (url: string): { owner: string; repo: string; number: number } | null => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2],
      number: parseInt(match[3]),
    };
  };

  /**
   * Load issue from GitHub URL or markdown
   */
  const handleLoadIssue = async () => {
    if (!input.trim()) {
      setError('Please enter a GitHub issue URL or markdown content');
      return;
    }

    if (!state.config) {
      setError('Please configure your API keys in the Configuration step first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let issue: GitHubIssue;

      if (inputType === 'url') {
        const parsed = parseGitHubUrl(input);
        if (!parsed) {
          setError('Invalid GitHub issue URL format. Expected: https://github.com/owner/repo/issues/123');
          return;
        }
        
        // Fetch issue from GitHub API
        const githubClient = new GitHubClient(state.config.githubPat);
        issue = await githubClient.fetchIssue(input);
      } else {
        // Parse markdown input
        const lines = input.split('\n');
        const title = lines[0]?.replace(/^#\s*/, '') || 'Untitled Issue';
        const body = lines.slice(1).join('\n').trim();
        
        issue = {
          title,
          body,
        };
      }

      setIssue(issue);
      setError(null);
      setStep(2); // Move to Clarification step
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Start New Decomposition
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Paste a GitHub issue URL or enter markdown content to begin the decomposition process.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* Input Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Input Method
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setInputType('url')}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                  inputType === 'url'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600'
                    : 'text-gray-600 border-gray-200 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:border-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <span className="text-lg">🔗</span>
                <span>GitHub URL</span>
              </button>
              <button
                onClick={() => setInputType('markdown')}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                  inputType === 'markdown'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600'
                    : 'text-gray-600 border-gray-200 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:border-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <span className="text-lg">📄</span>
                <span>Markdown Content</span>
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {inputType === 'url' 
                ? 'Paste GitHub Issue URL:' 
                : 'Enter Issue Content (Markdown):'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                inputType === 'url'
                  ? 'https://github.com/owner/repo/issues/123'
                  : '# Issue Title\n\nIssue description goes here...\n\n## Problem\nDescribe the problem you\'re facing.\n\n## Expected Behavior\nWhat should happen?\n\n## Additional Context\nAny other relevant information.'
              }
              rows={inputType === 'url' ? 4 : 12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base leading-relaxed transition-colors resize-none"
              disabled={state.isLoading}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {inputType === 'url' 
                ? 'Supports both public and private GitHub repositories (requires proper PAT permissions)'
                : 'Use markdown formatting for better structure. Include sections like Problem, Expected Behavior, and Additional Context.'}
            </p>
          </div>

          {/* Configuration Warning */}
          {!state.config && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-500 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Configuration Required
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Please configure your API keys in the Configuration step before loading GitHub issues.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Issue Display */}
          {state.issue && (
            <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-lg flex-shrink-0">✅</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                    Current Issue Loaded:
                  </h3>
                  <p className="text-base font-medium text-green-900 dark:text-green-100 mb-2">
                    {state.issue.title}
                  </p>
                  {state.issue.url && (
                    <a
                      href={state.issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 font-medium hover:underline"
                    >
                      <span className="mr-1">🔗</span>
                      View on GitHub →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleLoadIssue}
              disabled={!input.trim() || state.isLoading || (inputType === 'url' && !state.config)}
              className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              {state.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Load Issue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}