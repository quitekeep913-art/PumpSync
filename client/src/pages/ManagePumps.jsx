import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; // Hum purana layout design hi use karenge

function ManagePumps() {
  const [pumps, setPumps] = useState([]);
  const [pumpNumber, setPumpNumber] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Database se saare pumps mangwane ka function
  const fetchPumps = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pumps/all');
      setPumps(response.data);
    } catch (error) {
      console.error('Error fetching pumps', error);
    }
  };

  // Page load hote hi pumps fetch karo
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchPumps();
  }, [navigate]);

  // Naya pump add karne ka function
  const handleAddPump = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/pumps/add', {
        pumpNumber,
        fuelType
      });
      setMessage('Pump added successfully! ✅');
      setPumpNumber(''); // Form clear karo
      fetchPumps(); // List ko refresh karo taake naya pump nazar aaye
      
      // 3 second baad message ghayab kar do
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error adding pump ❌');
    }
  };

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
          <li onClick={() => navigate('/dashboard')}>Overview</li>
          <li className="active">Manage Pumps</li>
          <li>Fuel Inventory</li>
          <li>Daily Reports</li>
          <li>Settings</li>
        </ul>
      </div>

      {/* Right Main Content */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-welcome">
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Pump Management</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        <div className="dashboard-content">
          
          {/* Add New Pump Form */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', borderTop: '4px solid #3498db' }}>
            <h3 style={{ marginTop: '0', color: '#2c3e50', marginBottom: '20px' }}>Add New Pump</h3>
            
            <form onSubmit={handleAddPump} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: '1', minWidth: '200px' }}>
                <label style={{ marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Pump Number (e.g. Pump 1)</label>
                <input 
                  type="text" 
                  value={pumpNumber} 
                  onChange={(e) => setPumpNumber(e.target.value)} 
                  required 
                  style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '15px' }}
                  placeholder="Enter pump number"
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', flex: '1', minWidth: '200px' }}>
                <label style={{ marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Fuel Type</label>
                <select 
                  value={fuelType} 
                  onChange={(e) => setFuelType(e.target.value)}
                  style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '15px', backgroundColor: 'white' }}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>

              <button type="submit" style={{ padding: '12px 25px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', height: '45px' }}>
                + Add Pump
              </button>
            </form>
            {message && <p style={{ color: '#2ecc71', fontWeight: 'bold', marginTop: '15px' }}>{message}</p>}
          </div>

          {/* Pumps List Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                <tr>
                  <th style={{ padding: '15px 20px' }}>Pump Number</th>
                  <th style={{ padding: '15px 20px' }}>Fuel Type</th>
                  <th style={{ padding: '15px 20px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pumps.map((pump) => (
                  <tr key={pump._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#333' }}>{pump.pumpNumber}</td>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: pump.fuelType === 'Petrol' ? '#e74c3c' : '#f39c12' }}>{pump.fuelType}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ padding: '5px 10px', backgroundColor: '#e8f8f5', color: '#27ae60', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                        {pump.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pumps.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No pumps added yet. Add a pump from above!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default ManagePumps;