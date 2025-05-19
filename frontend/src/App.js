import React from 'react';
import './App.css';
import Assessment from './Assessment';

function App() {
  return (
    <div className="container">
      <header className="app-header">
        <h1>MentorMe</h1>
        <p>Professional Development for Early Childhood Educators</p>
      </header>
      <main>
        <Assessment />
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 Raising Arizona Preschool. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;