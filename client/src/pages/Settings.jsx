import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [stationName, setStationName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState(1000);
  const [message, setMessage] = useState('');

  // Load current settings from PostgreSQL
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/settings');
        if (res.data) {
          setStationName(res.data.stationName || '');
          setManagerName(res.data.managerName || '');
          setPhone(res.data.phone || '');
          setAddress(res.data.address || '');
          setLowStockAlert(res.data.lowStockAlert || 1000);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Save updated settings
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/settings/update', {
        stationName,
        managerName,
        phone,
        address,
        lowStockAlert: Number(lowStockAlert),
      });
      setMessage('Settings saved successfully! ✅');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Error saving settings ❌');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '750px', margin: '0 auto' }}>
      <div
        style={{
          backgroundColor: '#fff',
          padding: '28px',
          borderRadius: '10px',
          borderTop: '4px solid #3498db',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '22px', color: '#2c3e50' }}>
          Station Settings
        </h2>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Station Name
            </label>
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
                Manager Name
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Station Address
            </label>
            <textarea
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Low Stock Alert Limit (Liters)
            </label>
            <input
              type="number"
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              marginTop: '6px',
            }}
          >
            Save Settings
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '14px', fontWeight: '600', color: message.includes('❌') ? '#e74c3c' : '#27ae60' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Settings;