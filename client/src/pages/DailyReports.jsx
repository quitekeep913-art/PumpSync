import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DailyReports = () => {
  const [sales, setSales] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [pumpNumber, setPumpNumber] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [litersSold, setLitersSold] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [message, setMessage] = useState('');

  // Fetch sales, pumps, and inventory data
  const fetchData = async () => {
    try {
      const [salesRes, pumpsRes, invRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sales/all'),
        axios.get('http://localhost:5000/api/pumps/all'),
        axios.get('http://localhost:5000/api/inventory/all'),
      ]);
      setSales(salesRes.data);
      setPumps(pumpsRes.data);
      setInventory(invRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-fill fuel type and price when a pump is selected
  const handlePumpChange = (selectedPumpNumber) => {
    setPumpNumber(selectedPumpNumber);
    const selectedPump = pumps.find((p) => p.pumpNumber === selectedPumpNumber);
    if (selectedPump) {
      setFuelType(selectedPump.fuelType);
      const matchingTank = inventory.find((t) => t.fuelType === selectedPump.fuelType);
      if (matchingTank) {
        setPricePerLiter(matchingTank.pricePerLiter);
      }
    }
  };

  // Add a new sale
  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/sales/add', {
        pumpNumber,
        fuelType,
        litersSold: Number(litersSold),
        pricePerLiter: Number(pricePerLiter),
      });
      setLitersSold('');
      setMessage('Sale recorded & inventory updated! ✅');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding sale:', error);
      setMessage('Error recording sale ❌');
    }
  };

  // Delete a sale record
  const handleDeleteSale = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/sales/delete/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  // Calculate summary totals
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalLiters = sales.reduce((sum, s) => sum + Number(s.litersSold), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1050px', margin: '0 auto' }}>
      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: '220px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '10px',
            borderLeft: '5px solid #27ae60',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          }}
        >
          <p style={{ margin: 0, color: '#7f8c8d', fontWeight: '600' }}>Total Revenue</p>
          <h2 style={{ margin: '8px 0 0', color: '#27ae60' }}>
            Rs. {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: '220px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '10px',
            borderLeft: '5px solid #3498db',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          }}
        >
          <p style={{ margin: 0, color: '#7f8c8d', fontWeight: '600' }}>Total Fuel Sold</p>
          <h2 style={{ margin: '8px 0 0', color: '#2c3e50' }}>
            {totalLiters.toLocaleString()} Liters
          </h2>
        </div>
      </div>

      {/* Record New Sale Card */}
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
          Record Daily Sale
        </h2>

        <form
          onSubmit={handleAddSale}
          style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Select Pump
            </label>
            <select
              value={pumpNumber}
              onChange={(e) => handlePumpChange(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="">-- Choose Pump --</option>
              {pumps.map((pump) => (
                <option key={pump._id} value={pump.pumpNumber}>
                  {pump.pumpNumber} ({pump.fuelType})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Fuel Type
            </label>
            <input
              type="text"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Liters Sold
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 50"
              value={litersSold}
              onChange={(e) => setLitersSold(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#34495e' }}>
              Price / Liter (Rs.)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 275"
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
            + Add Sale
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '12px', fontWeight: '600', color: message.includes('❌') ? '#e74c3c' : '#27ae60' }}>
            {message}
          </p>
        )}
      </div>

      {/* Sales History Table */}
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
              <th style={{ padding: '14px 18px' }}>Date & Time</th>
              <th style={{ padding: '14px 18px' }}>Pump</th>
              <th style={{ padding: '14px 18px' }}>Fuel Type</th>
              <th style={{ padding: '14px 18px' }}>Liters Sold</th>
              <th style={{ padding: '14px 18px' }}>Price / L</th>
              <th style={{ padding: '14px 18px' }}>Total Amount</th>
              <th style={{ padding: '14px 18px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                  No sales recorded yet. Add a sale from above!
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '14px 18px', fontSize: '13px', color: '#555' }}>
                    {new Date(sale.saleDate).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: '600' }}>{sale.pumpNumber}</td>
                  <td style={{ padding: '14px 18px', color: '#c0392b', fontWeight: '600' }}>
                    {sale.fuelType}
                  </td>
                  <td style={{ padding: '14px 18px' }}>{Number(sale.litersSold).toLocaleString()} L</td>
                  <td style={{ padding: '14px 18px' }}>Rs. {sale.pricePerLiter}</td>
                  <td style={{ padding: '14px 18px', fontWeight: '700', color: '#27ae60' }}>
                    Rs. {Number(sale.totalAmount).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
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

export default DailyReports;