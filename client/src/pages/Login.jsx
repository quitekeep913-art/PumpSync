import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate(); // Added for redirection

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(''); 
    setIsError(false);

    try {
      const response = await axios.post('http://localhost:5000/auth/login', {
        email,
        password
      });

      localStorage.setItem('token', response.data.token);
      
      setMessage('Login successful! Redirecting...');
      setIsError(false);
      
      // Redirect user to the dashboard page
      navigate('/dashboard');

    } catch (error) {
      setIsError(true);
      if (error.response) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Network Error. Please try again.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>PumpSync</h2>
        <p className="login-subtitle">Sign in to manage your station</p>
        
        <form onSubmit={handleLogin}>
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
          
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
        
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