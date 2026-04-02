import React from 'react';
import './App.css';
import Onboarding from './components/Onboarding/Onboarding';
import Recommendation from './components/Recommendation';

function App() {
  return (
    <div className="App">
      <Onboarding />
      <Recommendation />
    </div>
  );
}

export default App;
