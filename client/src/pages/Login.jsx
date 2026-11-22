import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Owner');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  // Agar aapke server/index.js mein '/api/auth' laga hai toh neeche '/api/auth' kar dein
  const AUTH_BASE_URL = 'http://localhost:5000/auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      if (isRegister) {
        await axios.post(`${AUTH_BASE_URL}/register`, {
          name,
          email,
          password,
          role,
        });
        setMessage('Account registered successfully! Ab Sign In karein.');
        setIsRegister(false);
        setPassword('');
      } else {
        const response = await axios.post(`${AUTH_BASE_URL}/login`, {
          email,
          password,
        });

        localStorage.setItem('token', response.data.token);
        if (response.data.role) {
          localStorage.setItem('role', response.data.role);
        }

        setMessage('Login successful! Redirecting...');
        setIsError(false);
        navigate('/dashboard');
      }
    } catch (error) {
      setIsError(true);
      if (error.response) {
        setMessage(error.response.data.error || error.response.data.message || 'Request failed');
      } else {
        setMessage('Network Error. Please try again.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>PumpSync</h2>
        <p className="login-subtitle">
          {isRegister ? 'Create an Owner or Fleet Manager account' : 'Sign in to manage your station'}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@pumpsync.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <label>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="Owner">Owner</option>
                <option value="Fleet Manager">Fleet Manager</option>
              </select>
            </div>
          )}

          <button type="submit" className="login-button">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage('');
            setIsError(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            marginTop: '12px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {isRegister ? 'Already have an account? Sign In' : 'New Owner / Fleet Manager? Register'}
        </button>

        {message && (
          <p className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;