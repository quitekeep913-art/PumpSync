import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; // Importing the CSS

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data.userData);
      } catch (error) {
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
    <div className="dashboard-container">
      
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-brand">PumpSync</div>
        <ul className="sidebar-menu">
          <li className="active">Overview</li>
          <li onClick={() => navigate('/manage-pumps')}>Manage Pumps</li>
          <li>Fuel Inventory</li>
          <li>Daily Reports</li>
          <li>Settings</li>
        </ul>
      </div>

      {/* Right Main Content */}
      <div className="main-content">
        
        {/* Top Navigation Bar */}
        <div className="topbar">
          <div className="topbar-welcome">
            {userData ? (
              <span>Welcome back, <span className="role-badge">{userData.role}</span>!</span>
            ) : (
              <span>Loading profile...</span>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        {/* Page Content */}
        <div className="dashboard-content">
          <h2 className="dashboard-title">System Overview</h2>
          
          {/* Summary Cards */}
          <div className="cards-grid">
            <div className="stat-card">
              <h3>Total Pumps</h3>
              <p className="value">4</p>
            </div>
            <div className="stat-card" style={{borderTopColor: '#2ecc71'}}>
              <h3>Available Petrol</h3>
              <p className="value">2,450 L</p>
            </div>
            <div className="stat-card" style={{borderTopColor: '#f1c40f'}}>
              <h3>Available Diesel</h3>
              <p className="value">1,800 L</p>
            </div>
            <div className="stat-card" style={{borderTopColor: '#9b59b6'}}>
              <h3>Today's Sales</h3>
              <p className="value">Rs 45,000</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Dashboard;