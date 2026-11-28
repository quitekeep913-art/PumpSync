import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FuelEntry = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [driverInfo, setDriverInfo] = useState(null);

  const [liters, setLiters] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState(260);
  const [odometerReading, setOdometerReading] = useState('');
  const [transactions, setTransactions] = useState([]);

  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const loadDriversAndTransactions = async () => {
    try {
      const [driversRes, txRes] = await Promise.all([
        axios.get('http://localhost:5000/api/fleet'),
        axios.get('http://localhost:5000/api/fuel-entry/transactions'),
      ]);
      setDrivers(driversRes.data || []);
      setTransactions(txRes.data || []);
    } catch (error) {
      console.error('Error loading fuel entry data:', error);
    }
  };

  useEffect(() => {
    loadDriversAndTransactions();
  }, []);

  const handleLookupByQr = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsError(false);

    if (!qrInput.trim()) {
      setIsError(true);
      setStatusMessage('Please enter or paste QR payload data.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/fuel-entry/lookup', {
        qrData: qrInput.trim(),
      });
      setDriverInfo(res.data);
      setSelectedDriverId(String(res.data.id));
    } catch (error) {
      setDriverInfo(null);
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Driver lookup failed.');
    }
  };

  const handleSelectDriver = async (driverId) => {
    setSelectedDriverId(driverId);
    setStatusMessage('');
    setIsError(false);

    if (!driverId) {
      setDriverInfo(null);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/fuel-entry/lookup', {
        driverId: Number(driverId),
      });
      setDriverInfo(res.data);
    } catch (error) {
      setDriverInfo(null);
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to load driver details.');
    }
  };

  const handleDispenseFuel = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsError(false);

    const targetDriverId = driverInfo?.id || Number(selectedDriverId);
    if (!targetDriverId) {
      setIsError(true);
      setStatusMessage('Please scan/load a driver first.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/fuel-entry/dispense', {
        driverId: targetDriverId,
        liters: Number(liters),
        ratePerLiter: Number(ratePerLiter),
        odometerReading: Number(odometerReading),
      });

      setIsError(false);
      setStatusMessage(
        `${res.data.message} Remaining monthly limit: ${res.data.remainingLimit} L.`
      );
      setLiters('');
      setOdometerReading('');

      await handleSelectDriver(String(targetDriverId));
      await loadDriversAndTransactions();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Fuel transaction rejected.');
    }
  };
const handleDeleteTransaction = async (txId) => {
   const confirmed = window.confirm('Are you sure you want to delete this transaction?');
    if (!confirmed) return;

    try {
      const res = await axios.delete(`http://localhost:5000/api/fuel-entry/transactions/${txId}`);
      setIsError(false);
      setStatusMessage(res.data.message || 'Transaction deleted.');

      if (driverInfo?.id) {
        await handleSelectDriver(String(driverInfo.id));
      }
      await loadDriversAndTransactions();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to delete transaction.');
    }
  };
  const estimatedTotal = (Number(liters || 0) * Number(ratePerLiter || 0)).toFixed(2);

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
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>QR Scan & Fuel Dispensing</h2>

        {/* Step A: QR Lookup or Quick Driver Select */}
        <form
          onSubmit={handleLookupByQr}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}
        >
          <input
            type="text"
            placeholder='Paste QR JSON payload or vehicle number (e.g. MN-12)'
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Verify QR Payload
          </button>
        </form>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
            Or Select Driver Manually (For Quick Testing)
          </label>
          <select
            value={selectedDriverId}
            onChange={(e) => handleSelectDriver(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          >
            <option value="">-- Select Driver --</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.driverName} ({d.vehicleNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Driver Verification Card */}
        {driverInfo && (
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e1e5ea',
              marginBottom: '18px',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#2c3e50' }}>
              Verified Driver: {driverInfo.driverName}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '14px',
              }}
            >
              <div><strong>Vehicle:</strong> {driverInfo.vehicleNumber}</div>
              <div><strong>Tank Capacity:</strong> {driverInfo.tankCapacity} L</div>
              <div>
                <strong>Monthly Limit:</strong> {driverInfo.usedLiters} / {driverInfo.monthlyLimitLiters} L
              </div>
              <div>
                <strong>Remaining Limit:</strong> {driverInfo.remainingLimit} L
              </div>
              <div>
                <strong>Allowed Window:</strong> {driverInfo.allowedStartTime} – {driverInfo.allowedEndTime}
              </div>
              <div>
                <strong>Status & Window:</strong>{' '}
                <span
                  style={{
                    color: driverInfo.isActive && driverInfo.timeAllowed ? '#27ae60' : '#e74c3c',
                    fontWeight: '600',
                  }}
                >
                  {!driverInfo.isActive
                    ? 'Inactive'
                    : driverInfo.timeAllowed
                    ? 'Eligible'
                    : 'Outside Window'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step B: Dispense Form */}
        <form
          onSubmit={handleDispenseFuel}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Fuel Liters (L)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 25"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Rate per Liter
            </label>
            <input
              type="number"
              step="0.01"
              value={ratePerLiter}
              onChange={(e) => setRatePerLiter(e.target.value)}
              required
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Odometer Reading (km)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 45210"
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ fontWeight: '600', color: '#2c3e50', paddingBottom: '10px' }}>
              Estimated Total: {estimatedTotal}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                padding: '11px 22px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Confirm Fuel Dispense
            </button>
          </div>
        </form>

        {statusMessage && (
          <p
            style={{
              marginTop: '14px',
              fontWeight: '600',
              color: isError ? '#e74c3c' : '#27ae60',
            }}
          >
            {statusMessage}
          </p>
        )}
      </div>
   
      {/* Recent Fuel Transactions Table */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          overflowX: 'auto',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Recent QR Fuel Transactions</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f6f9', textAlign: 'left' }}>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Driver</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Vehicle</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Liters</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Rate</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Total</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Odometer</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.driverName}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.vehicleNumber}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.liters} L</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.ratePerLiter}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.totalAmount}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{t.odometerReading} km</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(t.id)}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '14px', textAlign: 'center', color: '#777' }}>
                  No fuel transactions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FuelEntry;