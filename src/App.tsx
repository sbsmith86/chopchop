import React from 'react';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/AppShell';
import './App.css';

/**
 * Main ChopChop application component
 * Modern, clean interface for GitHub issue decomposition
 */
function App(): React.JSX.Element {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppShell />
      </div>
    </AppProvider>
  );
}

export default App;
