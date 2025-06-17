import React, { useState } from 'react';
import axios from 'axios';

/**
 * Direct Login Page
 * 
 * This is a super-minimal login page that doesn't rely on any complex
 * components or context. It's used as a fallback when main login has issues.
 */
const DirectLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('Logging in...');

    try {
      // Use separate login server to bypass Vite middleware issues
      const response = await axios.post('http://localhost:5001/login', { 
        username, 
        password 
      });
      
      if (response.status === 200 && response.data) {
        // Save auth directly to localStorage
        localStorage.setItem('auth', JSON.stringify({
          user: response.data,
          timestamp: Date.now()
        }));
        
        setMessage('Login successful! Redirecting...');
        
        // Direct navigation to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        setError('Invalid response from server');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem',
      backgroundColor: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center'}}>
          MentorMe Login
        </h1>
        
        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '0.25rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        
        {message && !error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#d1fae5',
            color: '#047857',
            borderRadius: '0.25rem',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '1rem'}}>
            <label htmlFor="username" style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db'
              }}
              required
            />
          </div>
          
          <div style={{marginBottom: '1.5rem'}}>
            <label htmlFor="password" style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db'
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <a 
            href="/login" 
            style={{color: '#3b82f6', textDecoration: 'none'}}
          >
            Return to main login page
          </a>
        </div>
        
        <div style={{marginTop: '1rem', textAlign: 'center'}}>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectLogin;