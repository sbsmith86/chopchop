import React from 'react';
import { AppProvider } from './context/AppContext';
import AppShell from './components/AppShell';
import './App.css';

/**
 * Main App component
 */
function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
