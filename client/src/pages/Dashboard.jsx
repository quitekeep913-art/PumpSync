import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const ROLE_MENUS = {
  owner: [
    { label: 'Overview', path: null, active: true },
    { label: 'Manage Pumps', path: '/manage-pumps' },
    { label: 'Fuel Inventory', path: '/fuel-inventory' },
    { label: 'Daily Reports', path: '/daily-reports' },
    { label: 'Fleet & QR', path: '/fleet' },
    { label: 'QR Fuel Entry', path: '/fuel-entry' },
    { label: 'Reconciliation & Alerts', path: '/reconciliation' },
    { label: 'Settings', path: '/settings' },
  ],
  fleet_manager: [
    { label: 'Overview', path: null, active: true },
    { label: 'Drivers & Vehicles', path: '/fleet' },
    { label: 'Fuel Limits & Time Windows', path: '/fleet-limits' },
    { label: 'Company Transactions', path: '/daily-reports' },
    { label: 'Settings', path: '/settings' },
  ],
  attendant: [
    { label: 'Overview', path: null, active: true },
    { label: 'QR Fuel Entry', path: '/fuel-entry' },
    { label: 'Shift & Calibration', path: '/reconciliation' },
    { label: 'Settings', path: '/settings' },
  ],
  driver: [
    { label: 'My Balance & QR', path: null, active: true },
    { label: 'Digital Receipts', path: '/daily-reports' },
    { label: 'Transaction History', path: '/fuel-entry' },
    { label: 'Settings', path: '/settings' },
  ],
  inspector: [
    { label: 'Aggregated Overview', path: null, active: true },
    { label: 'Discrepancy Summary', path: '/reconciliation' },
    { label: 'Calibration & Audit Logs', path: '/daily-reports' },
    { label: 'Settings', path: '/settings' },
  ],
};

function normalizeRole(rawRole) {
  if (!rawRole) return 'owner';
  const cleaned = rawRole.toString().trim().toLowerCase().replace(/\s+/g, '_');
  if (cleaned === 'manager') return 'fleet_manager';
  return ROLE_MENUS[cleaned] ? cleaned : 'owner';
}

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPumps: 0,
    petrolStock: 0,
    dieselStock: 0,
    todaySales: 0,
  });

  const activeRole = normalizeRole(userData?.role || localStorage.getItem('role'));
  const menuItems = ROLE_MENUS[activeRole] || ROLE_MENUS.owner;

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
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data.userData);
        if (response.data.userData?.role) {
          localStorage.setItem('role', response.data.userData.role);
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-brand">PumpSync</div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.label}
              className={item.active ? 'active' : ''}
              onClick={() => {
                if (item.path) navigate(item.path);
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Right Main Content */}
      <div className="main-content">
        {/* Top Navigation Bar */}
        <div className="topbar">
          <div className="topbar-welcome">
            {userData ? (
              <span>
                Welcome back, <span className="role-badge">{userData.role}</span>!
              </span>
            ) : (
              <span>Loading profile...</span>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Page Content */}
        <div className="dashboard-content">
          <h2 className="dashboard-title">System Overview</h2>

          {activeRole === 'owner' && (
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
          )}

          {activeRole === 'fleet_manager' && (
            <div className="cards-grid">
              <div className="stat-card">
                <h3>Fleet Management</h3>
                <p className="value">Drivers & Vehicles</p>
              </div>
              <div className="stat-card" style={{ borderTopColor: '#2ecc71' }}>
                <h3>Fuel Limits</h3>
                <p className="value">Monthly & Time Windows</p>
              </div>
              <div className="stat-card" style={{ borderTopColor: '#f1c40f' }}>
                <h3>Company Transactions</h3>
                <p className="value">Rs {stats.todaySales.toLocaleString()}</p>
              </div>
            </div>
          )}

          {activeRole === 'attendant' && (
            <div className="cards-grid">
              <div className="stat-card">
                <h3>Shift & Calibration</h3>
                <p className="value">5L Test & Meter</p>
              </div>
              <div className="stat-card" style={{ borderTopColor: '#2ecc71' }}>
                <h3>QR Fuel Entry</h3>
                <p className="value">Scan & Dispense</p>
              </div>
            </div>
          )}

          {activeRole === 'driver' && (
            <div className="cards-grid">
              <div className="stat-card">
                <h3>My Fuel Balance</h3>
                <p className="value">QR Pass & Limit</p>
              </div>
              <div className="stat-card" style={{ borderTopColor: '#2ecc71' }}>
                <h3>Digital Receipts</h3>
                <p className="value">Recent Fueling</p>
              </div>
            </div>
          )}

          {activeRole === 'inspector' && (
            <div className="cards-grid">
              <div className="stat-card">
                <h3>Monitored Pumps</h3>
                <p className="value">{stats.totalPumps}</p>
              </div>
              <div className="stat-card" style={{ borderTopColor: '#e74c3c' }}>
                <h3>Discrepancies & Calibrations</h3>
                <p className="value">Read-Only Audit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;