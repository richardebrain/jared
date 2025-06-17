import React, { useState, useEffect } from 'react';

/**
 * Direct Login Page
 * 
 * This is a super-minimal login page that doesn't rely on any complex
 * components or context. It's used as a fallback when main login has issues.
 */
const DirectLogin: React.FC = () => {
  const [username, setUsername] = useState('jlcookie20');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-attempt login when component mounts
  useEffect(() => {
    const attemptAutoLogin = async () => {
      setLoading(true);
      setMessage('Attempting automatic login...');

      try {
        const response = await fetch('http://localhost:5001/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: 'jlcookie20', password: 'password' }),
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data) {
          setMessage('Login successful! Redirecting to dashboard...');
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          setError('Auto-login failed. Please try manual login.');
          setLoading(false);
        }
      } catch (error) {
        setError('Auto-login failed. Please try manual login.');
        setLoading(false);
      }
    };

    attemptAutoLogin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('Logging in...');

    try {
      // Try main login route first
      let response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      let data;
      try {
        data = await response.json();
      } catch {
        // If we can't parse JSON, try the direct login server
        console.log('Main login failed, trying direct server');
        
        response = await fetch('http://localhost:5001/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          credentials: 'include'
        });
        
        data = await response.json();
      }

      if (response.ok && data) {
        setMessage('Login successful! Redirecting...');
        
        // Direct navigation to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
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
          MentorMe Direct Login
        </h1>
        
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#dbeafe',
          color: '#1d4ed8',
          borderRadius: '0.25rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          Auto-login with demo credentials: jlcookie20 / password
        </div>
        
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