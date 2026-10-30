import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // useEffect runs automatically when the Dashboard component loads
  useEffect(() => {
    const fetchUserProfile = async () => {
      // 1. Get the token we saved during login
      const token = localStorage.getItem('token');
      
      // 2. If no token is found, kick the user back to the login page
      if (!token) {
        navigate('/');
        return;
      }

      try {
        // 3. Send the token to the backend to get user details
        const response = await axios.get('http://localhost:5000/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // 4. Save the received user data into state
        setUserData(response.data.userData);
      } catch (error) {
        console.error("Authentication failed:", error);
        // If token is invalid or expired, clear it and redirect to login
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h2>PumpSync Dashboard</h2>
      
      {/* Display user specific data if loaded */}
      {userData ? (
        <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <p style={{ margin: '0', fontSize: '18px' }}>
            Welcome back, <strong style={{ textTransform: 'capitalize', color: '#007bff' }}>{userData.role}</strong>!
          </p>
        </div>
      ) : (
        <p>Loading user profile...</p>
      )}

      <p>Welcome to the control panel. Here you will manage pumps, fuel inventory, and reports.</p>
      
      <button 
        onClick={handleLogout}
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#dc3545', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer' 
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;