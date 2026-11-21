import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FuelInventory = () => {
  const [tanks, setTanks] = useState([]);
  const [fuelType, setFuelType] = useState('Petrol');
  const [capacity, setCapacity] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [message, setMessage] = useState('');

  // State for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Fetch all fuel tanks
  const fetchTanks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory/all');
      setTanks(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchTanks();
  }, []);

  // Add a new fuel tank
  const handleAddTank = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/inventory/add', {
        fuelType,
        capacity: Number(capacity),
        currentStock: Number(currentStock),
        pricePerLiter: Number(pricePerLiter),
      });
      setCapacity('');
      setCurrentStock('');
      setPricePerLiter('');
      setMessage('Fuel tank added successfully! ✅');
      fetchTanks();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding tank:', error);
      setMessage(error.response?.data?.message || 'Error adding fuel tank ❌');
    }
  };

  // Start editing a tank's stock and price
  const startEditing = (tank) => {
    setEditingId(tank.id);
    setEditStock(tank.currentStock);
    setEditPrice(tank.pricePerLiter);
  };

  // Save updated stock and price
  const handleUpdateTank = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/update/${id}`, {
        currentStock: Number(editStock),
        pricePerLiter: Number(editPrice),
      });
      setEditingId(null);
      fetchTanks();
    } catch (error) {
      console.error('Error updating tank:', error);
    }
  };

  // Delete a fuel tank
  const handleDeleteTank = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fuel tank?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/inventory/delete/${id}`);
      fetchTanks();
    } catch (error) {
      console.error('Error deleting tank:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1050px', margin: '0 auto' }}>
      {/* Add New Tank Card */}
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
          Add Fuel Tank
        </h2>

        <form
          onSubmit={handleAddTank}
          style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Fuel Type
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Hi-Octane">Hi-Octane</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Capacity (Liters)
            </label>
            <input
              type="number"
              placeholder="e.g. 20000"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Current Stock (Liters)
            </label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Price / Liter (Rs.)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 275.50"
              value={pricePerLiter}
              onChange={(e) => setPricePerLiter(e.target.value)}
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
              padding: '11px 22px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Add Tank
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '12px', fontWeight: '600', color: message.includes('❌') ? '#e74c3c' : '#27ae60' }}>
            {message}
          </p>
        )}
      </div>

      {/* Inventory Table */}
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
              <th style={{ padding: '14px 18px' }}>Fuel Type</th>
              <th style={{ padding: '14px 18px' }}>Capacity (L)</th>
              <th style={{ padding: '14px 18px' }}>Current Stock (L)</th>
              <th style={{ padding: '14px 18px' }}>Level</th>
              <th style={{ padding: '14px 18px' }}>Price / Liter</th>
              <th style={{ padding: '14px 18px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tanks.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                  No fuel tanks added yet. Add a tank from above!
                </td>
              </tr>
            ) : (
              tanks.map((tank) => {
                const percentage = Math.min(100, Math.round((tank.currentStock / tank.capacity) * 100));
                const barColor = percentage < 20 ? '#e74c3c' : percentage < 50 ? '#f39c12' : '#27ae60';

                return (
                  <tr key={tank.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '600', color: '#2c3e50' }}>
                      {tank.fuelType}
                    </td>
                    <td style={{ padding: '14px 18px' }}>{Number(tank.capacity).toLocaleString()} L</td>
                    <td style={{ padding: '14px 18px' }}>
                      {editingId === tank.id ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          style={{ width: '90px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      ) : (
                        `${Number(tank.currentStock).toLocaleString()} L`
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', minWidth: '130px' }}>
                      <div style={{ backgroundColor: '#ecf0f1', borderRadius: '10px', height: '10px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{ width: `${percentage}%`, backgroundColor: barColor, height: '100%' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: barColor }}>{percentage}%</span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '600' }}>
                      {editingId === tank.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      ) : (
                        `Rs. ${tank.pricePerLiter}`
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', display: 'flex', gap: '8px' }}>
                      {editingId === tank.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateTank(tank.id)}
                            style={{ backgroundColor: '#27ae60', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ backgroundColor: '#95a5a6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(tank)}
                            style={{ backgroundColor: '#3498db', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteTank(tank.id)}
                            style={{ backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FuelInventory;