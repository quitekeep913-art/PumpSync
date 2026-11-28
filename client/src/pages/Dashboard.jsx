import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; // Importing the CSS

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPumps: 0,
    petrolStock: 0,
    dieselStock: 0,
    todaySales: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [pumpsRes, invRes, salesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/pumps/all'),
          axios.get('http://localhost:5000/api/inventory/all'),
          axios.get('http://localhost:5000/api/sales/all'),
        ]);

        const petrolTank = invRes.data.find((t) => t.fuelType === 'Petrol');
        const dieselTank = invRes.data.find((t) => t.fuelType === 'Diesel');

        // Calculate today's sales total
        const today = new Date().toDateString();
        const todayRevenue = salesRes.data
          .filter((s) => new Date(s.saleDate).toDateString() === today)
          .reduce((sum, s) => sum + Number(s.totalAmount), 0);

        setStats({
          totalPumps: pumpsRes.data.length,
          petrolStock: petrolTank ? Number(petrolTank.currentStock) : 0,
          dieselStock: dieselTank ? Number(dieselTank.currentStock) : 0,
          todaySales: todayRevenue,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);
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
          <li onClick={() => navigate('/fuel-inventory')}>Fuel Inventory</li>
          <li onClick={() => navigate('/daily-reports')}>Daily Reports</li>
          <li onClick={() => navigate('/settings')}>Settings</li>
          <li onClick={() => navigate('/fleet')}>Fleet & QR</li>
          <li onClick={() => navigate('/fuel-entry')}>QR Fuel Entry</li>
          <li onClick={() => navigate('/reconciliation')}>Reconciliation & Alerts</li>
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
            <p className="value">{stats.totalPumps}</p>
          </div>
          <div className="stat-card" style={{ borderTopColor: '#2ecc71' }}>
            <h3>Available Petrol</h3>
            <p className="value">{stats.petrolStock.toLocaleString()} L</p>
          </div>
          <div className="stat-card" style={{ borderTopColor: '#f1c40f' }}>
            <h3>Available Diesel</h3>
            <p className="value">{stats.dieselStock.toLocaleString()} L</p>
          </div>
          <div className="stat-card" style={{ borderTopColor: '#9b59b6' }}>
            <h3>Today's Sales</h3>
            <p className="value">Rs {stats.todaySales.toLocaleString()}</p>
          </div>
        </div>
          
        </div>
      </div>
    </div>
  );
}

export default Dashboard;