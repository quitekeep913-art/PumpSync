import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagePumps = () => {
  const [pumps, setPumps] = useState([]);
  const [pumpNumber, setPumpNumber] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [message, setMessage] = useState('');

  // Fetch all pumps when the page loads
  const fetchPumps = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pumps/all');
      setPumps(response.data);
    } catch (error) {
      console.error('Error fetching pumps:', error);
    }
  };

  useEffect(() => {
    fetchPumps();
  }, []);

  // Add a new pump
  const handleAddPump = async (e) => {
    e.preventDefault();
    if (!pumpNumber.trim()) return;

    try {
      await axios.post('http://localhost:5000/api/pumps/add', {
        pumpNumber,
        fuelType,
      });
      setPumpNumber('');
      setMessage('Pump added successfully! ✅');
      fetchPumps();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding pump:', error);
      setMessage('Error adding pump ❌');
    }
  };

  // Toggle pump status between Active and Inactive
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`http://localhost:5000/api/pumps/status/${id}`, {
        status: newStatus,
      });
      fetchPumps();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Delete a pump
  const handleDeletePump = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pump?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/pumps/delete/${id}`);
      fetchPumps();
    } catch (error) {
      console.error('Error deleting pump:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Add New Pump Card */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '10px',
          borderTop: '4px solid #3498db',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          marginBottom: '30px',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>
          Add New Pump
        </h2>

        <form
          onSubmit={handleAddPump}
          style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Pump Number (e.g. Pump 1)
            </label>
            <input
              type="text"
              placeholder="Enter pump number"
              value={pumpNumber}
              onChange={(e) => setPumpNumber(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Fuel Type
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                boxSizing: 'border-box',
              }}
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hi-Octane">Hi-Octane</option>
            </select>
          </div>

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
            + Add Pump
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '12px', fontWeight: '600', color: message.includes('❌') ? '#e74c3c' : '#27ae60' }}>
            {message}
          </p>
        )}
      </div>

      {/* Pumps List Table */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
              <th style={{ padding: '14px 18px' }}>Pump Number</th>
              <th style={{ padding: '14px 18px' }}>Fuel Type</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pumps.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                  No pumps added yet. Add a pump from above!
                </td>
              </tr>
            ) : (
              pumps.map((pump) => (
                <tr key={pump._id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{pump.pumpNumber}</td>
                  <td style={{ padding: '14px 18px', color: '#c0392b', fontWeight: '600' }}>
                    {pump.fuelType}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: pump.status === 'Active' ? '#e8f8f5' : '#fdedec',
                        color: pump.status === 'Active' ? '#1e8449' : '#c0392b',
                      }}
                    >
                      {pump.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleToggleStatus(pump._id, pump.status)}
                      style={{
                        backgroundColor: pump.status === 'Active' ? '#f39c12' : '#27ae60',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      {pump.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleDeletePump(pump._id)}
                      style={{
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagePumps;