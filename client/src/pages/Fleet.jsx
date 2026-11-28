import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';

const Fleet = () => {
  const [drivers, setDrivers] = useState([]);
  const [driverName, setDriverName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [tankCapacity, setTankCapacity] = useState(60);
  const [monthlyLimitLiters, setMonthlyLimitLiters] = useState(300);
  const [allowedStartTime, setAllowedStartTime] = useState('06:00');
  const [allowedEndTime, setAllowedEndTime] = useState('22:00');
  const [qrImages, setQrImages] = useState({});
  const [message, setMessage] = useState('');

  const generateQrImages = async (list) => {
    const map = {};
    for (const d of list) {
      try {
        map[d.id] = await QRCode.toDataURL(d.qrPayload);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    }
    setQrImages(map);
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/fleet');
      setDrivers(res.data || []);
      generateQrImages(res.data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.post('http://localhost:5000/api/fleet/add', {
        driverName,
        phone,
        vehicleNumber,
        tankCapacity: Number(tankCapacity),
        monthlyLimitLiters: Number(monthlyLimitLiters),
        allowedStartTime,
        allowedEndTime,
      });

      setDriverName('');
      setPhone('');
      setVehicleNumber('');
      setMessage('Driver added and QR code generated successfully.');
      fetchDrivers();
    } catch (error) {
      console.error('Error adding driver:', error);
      setMessage('Failed to add driver.');
    }
  };

  const toggleStatus = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/fleet/${id}/status`);
      fetchDrivers();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteDriver = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}" and their QR code?`
    );
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/fleet/${id}`);
      setMessage('Driver and QR code deleted successfully.');
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      setMessage('Failed to delete driver.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1050px', margin: '0 auto' }}>
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '10px',
          borderTop: '4px solid #3498db',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Fleet & Driver QR Management</h2>

        <form
          onSubmit={handleAddDriver}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Driver Name</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Vehicle Number</label>
            <input
              type="text"
              placeholder="MN-412"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Phone</label>
            <input
              type="text"
              placeholder="0300-0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Tank Capacity (L)</label>
            <input
              type="number"
              value={tankCapacity}
              onChange={(e) => setTankCapacity(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Monthly Limit (L)</label>
            <input
              type="number"
              value={monthlyLimitLiters}
              onChange={(e) => setMonthlyLimitLiters(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Allowed Window</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="time"
                value={allowedStartTime}
                onChange={(e) => setAllowedStartTime(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
              />
              <input
                type="time"
                value={allowedEndTime}
                onChange={(e) => setAllowedEndTime(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
              />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                padding: '11px 22px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Add Driver & Generate QR
            </button>
          </div>
        </form>

        {message && (
          <p style={{ marginTop: '12px', fontWeight: '600', color: '#27ae60' }}>{message}</p>
        )}
      </div>

      {/* Drivers List + QR Codes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '18px',
        }}
      >
        {drivers.map((d) => {
          const remaining = Math.max(0, Number(d.monthlyLimitLiters) - Number(d.usedLiters));
          return (
            <div
              key={d.id}
              style={{
                backgroundColor: '#fff',
                padding: '18px',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              }}
            >
              <h3 style={{ margin: '0 0 6px 0', color: '#2c3e50' }}>{d.driverName}</h3>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Vehicle:</strong> {d.vehicleNumber}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Tank:</strong> {d.tankCapacity} L</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Limit:</strong> {d.usedLiters} / {d.monthlyLimitLiters} L ({remaining.toFixed(1)} L left)
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Time:</strong> {d.allowedStartTime} – {d.allowedEndTime}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Status:</strong>{' '}
                <span style={{ color: d.isActive ? '#27ae60' : '#e74c3c', fontWeight: '600' }}>
                  {d.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>

              {qrImages[d.id] && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <img
                    src={qrImages[d.id]}
                    alt={`QR for ${d.driverName}`}
                    style={{ width: '130px', height: '130px', border: '1px solid #eee', borderRadius: '6px' }}
                  />
                </div>
              )}
              <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(d.qrPayload);
                        setMessage(`QR payload copied for ${d.driverName}.`);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #3498db',
                        backgroundColor: '#ebf5fb',
                        color: '#2980b9',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                      }}
                    >
                      Copy QR Payload
                    </button>
                  </div>
              <button
                type="button"
                onClick={() => toggleStatus(d.id)}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {d.isActive ? 'Deactivate Driver' : 'Activate Driver'}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteDriver(d.id, d.driverName)}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Delete Driver
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Fleet;