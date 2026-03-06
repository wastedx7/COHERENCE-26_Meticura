import React from 'react';
import { AppRouter } from './app/router';
import { AuthSync } from './components/auth/AuthSync';

function App() {
  return (
    <AuthSync>
      <AppRouter />
    </AuthSync>
  );
}

export default App;
