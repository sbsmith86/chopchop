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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            📝 Start New Decomposition
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Paste a GitHub issue URL or enter markdown content to begin the decomposition process.
          </p>
        </div>

        <div className="px-6 py-4">
          {/* Input Type Selection */}
          <div className="mb-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setInputType('url')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  inputType === 'url'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                GitHub URL
              </button>
              <button
                onClick={() => setInputType('markdown')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  inputType === 'markdown'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Markdown Content
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  : '# Issue Title\n\nIssue description goes here...'
              }
              rows={inputType === 'url' ? 3 : 10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={state.isLoading}
            />
          </div>

          {/* Configuration Warning */}
          {!state.config && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Please configure your API keys in the Configuration step before loading GitHub issues.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Issue Display */}
          {state.issue && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Current Issue:
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                {state.issue.title}
              </p>
              {state.issue.url && (
                <a
                  href={state.issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  View on GitHub →
                </a>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleLoadIssue}
              disabled={!input.trim() || state.isLoading || (inputType === 'url' && !state.config)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isLoading ? 'Loading...' : 'Load Issue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}