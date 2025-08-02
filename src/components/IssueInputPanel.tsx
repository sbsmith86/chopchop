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
    <div className="h-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              📝
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Issue Input & Parsing
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Start your decomposition journey by providing a GitHub issue URL or entering markdown content directly.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Input Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Choose Input Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setInputType('url')}
                className={`p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                  inputType === 'url'
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-300 shadow-lg'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputType === 'url' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <span className="text-lg">🔗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">GitHub URL</h3>
                    <p className="text-sm opacity-75">Import from existing issue</p>
                  </div>
                </div>
                <p className="text-sm opacity-80">
                  Automatically fetch issue content from a GitHub repository
                </p>
              </button>
              
              <button
                onClick={() => setInputType('markdown')}
                className={`p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                  inputType === 'markdown'
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-300 shadow-lg'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputType === 'markdown' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <span className="text-lg">📄</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Markdown Content</h3>
                    <p className="text-sm opacity-75">Write or paste directly</p>
                  </div>
                </div>
                <p className="text-sm opacity-80">
                  Create new content using markdown formatting
                </p>
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {inputType === 'url' 
                ? 'GitHub Issue URL' 
                : 'Issue Content (Markdown)'}
            </label>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inputType === 'url'
                    ? 'https://github.com/owner/repo/issues/123'
                    : '# Issue Title\n\nDescribe the problem you\'re facing...\n\n## Expected Behavior\nWhat should happen?\n\n## Additional Context\nAny other relevant information.'
                }
                rows={inputType === 'url' ? 4 : 12}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base leading-relaxed transition-all resize-none hover:border-gray-400"
                disabled={state.isLoading}
              />
              {inputType === 'url' && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔗</span>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-500 flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5">💡</span>
              <span>
                {inputType === 'url' 
                  ? 'Supports both public and private GitHub repositories. Ensure your PAT has proper permissions for private repos.'
                  : 'Use markdown formatting for better structure. Include sections like Problem, Expected Behavior, and Additional Context for best results.'}
              </span>
            </p>
          </div>

          {/* Configuration Warning */}
          {!state.config && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600">⚠️</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    Configuration Required
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Please configure your API keys in the Configuration step before loading GitHub issues.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Issue Display */}
          {state.issue && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-xl shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600">✅</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">
                    Issue Successfully Loaded
                  </h3>
                  <p className="text-base font-medium text-green-900 mb-3 leading-relaxed">
                    {state.issue.title}
                  </p>
                  {state.issue.url && (
                    <a
                      href={state.issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <span className="mr-1">🔗</span>
                      View on GitHub →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button Footer */}
        <div className="border-t border-gray-100 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {inputType === 'url' 
                ? 'Ready to import from GitHub' 
                : 'Ready to process markdown content'}
            </div>
            <button
              onClick={handleLoadIssue}
              disabled={!input.trim() || state.isLoading || (inputType === 'url' && !state.config)}
              className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 border border-transparent rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
            >
              {state.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  {inputType === 'url' ? 'Import Issue' : 'Process Content'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}