import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reconciliation = () => {
  const [shifts, setShifts] = useState([]);
  const [calibrations, setCalibrations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ totalDispensedLiters: 0, totalDispensedAmount: 0 });

  // Shift Reconciliation form state
  const [shiftName, setShiftName] = useState('Morning Shift');
  const [nozzleLabel, setNozzleLabel] = useState('Nozzle 1');
  const [openingReading, setOpeningReading] = useState('');
  const [closingReading, setClosingReading] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState(260);
  const [shiftNotes, setShiftNotes] = useState('');

  // 5L Calibration form state
  const [calNozzle, setCalNozzle] = useState('Nozzle 1');
  const [measuredLiters, setMeasuredLiters] = useState('5.00');
  const [calNotes, setCalNotes] = useState('');

  // Manual Theft / Suspicious Alert form state
  const [alertType, setAlertType] = useState('Suspicious Fuel Activity');
  const [severity, setSeverity] = useState('High');
  const [alertDescription, setAlertDescription] = useState('');

  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const loadOverview = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reconciliation/overview');
      setShifts(res.data.shifts || []);
      setCalibrations(res.data.calibrations || []);
      setAlerts(res.data.alerts || []);
      setSummary(res.data.summary || { totalDispensedLiters: 0, totalDispensedAmount: 0 });
    } catch (error) {
      console.error('Error loading reconciliation data:', error);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSaveShift = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsError(false);

    try {
      const res = await axios.post('http://localhost:5000/api/reconciliation/shifts', {
        shiftName,
        nozzleLabel,
        openingReading: Number(openingReading),
        closingReading: Number(closingReading),
        cashCollected: Number(cashCollected),
        ratePerLiter: Number(ratePerLiter),
        notes: shiftNotes,
      });

      setStatusMessage(res.data.message || 'Shift reconciliation saved.');
      setOpeningReading('');
      setClosingReading('');
      setCashCollected('');
      setShiftNotes('');
      await loadOverview();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to save shift reconciliation.');
    }
  };

  const handleSaveCalibration = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsError(false);

    try {
      const res = await axios.post('http://localhost:5000/api/reconciliation/calibrations', {
        nozzleLabel: calNozzle,
        measuredLiters: Number(measuredLiters),
        notes: calNotes,
      });

      setStatusMessage(res.data.message || '5L calibration recorded.');
      setMeasuredLiters('5.00');
      setCalNotes('');
      await loadOverview();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to log calibration.');
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsError(false);

    try {
      const res = await axios.post('http://localhost:5000/api/reconciliation/alerts', {
        alertType,
        severity,
        description: alertDescription,
      });

      setStatusMessage(res.data.message || 'Alert logged.');
      setAlertDescription('');
      await loadOverview();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to log alert.');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await axios.patch(`http://localhost:5000/api/reconciliation/alerts/${alertId}/resolve`);
      setIsError(false);
      setStatusMessage('Alert marked as resolved.');
      await loadOverview();
    } catch (error) {
      setIsError(true);
      setStatusMessage('Failed to resolve alert.');
    }
  };
const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift record?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/reconciliation/shifts/${shiftId}`);
      setIsError(false);
      setStatusMessage(res.data.message || 'Shift record deleted.');
      await loadOverview();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to delete shift record.');
    }
  };

  const handleDeleteCalibration = async (calId) => {
    if (!window.confirm('Are you sure you want to delete this calibration log?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/reconciliation/calibrations/${calId}`);
      setIsError(false);
      setStatusMessage(res.data.message || 'Calibration log deleted.');
      await loadOverview();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to delete calibration log.');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/reconciliation/alerts/${alertId}`);
      setIsError(false);
      setStatusMessage(res.data.message || 'Alert deleted.');
      await loadOverview();
    } catch (error) {
      setIsError(true);
      setStatusMessage(error.response?.data?.message || 'Failed to delete alert.');
    }
  };
  const openAlertsCount = alerts.filter((a) => !a.isResolved).length;

  return (
    <div style={{ padding: '20px', maxWidth: '1120px', margin: '0 auto' }}>
      {/* Top Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>System Dispensed Volume</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#2c3e50', marginTop: '4px' }}>
            {Number(summary.totalDispensedLiters || 0).toFixed(2)} L
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>System Dispensed Amount</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#27ae60', marginTop: '4px' }}>
            {Number(summary.totalDispensedAmount || 0).toFixed(2)}
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>Open Theft / Audit Alerts</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: openAlertsCount > 0 ? '#e74c3c' : '#2c3e50', marginTop: '4px' }}>
            {openAlertsCount}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            backgroundColor: isError ? '#fdecea' : '#eafaf1',
            color: isError ? '#c0392b' : '#1e8449',
            padding: '12px 16px',
            borderRadius: '8px',
            fontWeight: '600',
            marginBottom: '20px',
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Section 1: Shift Reconciliation */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '22px',
          borderRadius: '10px',
          borderTop: '4px solid #2c3e50',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Shift Reconciliation</h2>
        <form
          onSubmit={handleSaveShift}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Shift Name</label>
            <input
              type="text"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nozzle</label>
            <input
              type="text"
              value={nozzleLabel}
              onChange={(e) => setNozzleLabel(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Opening Meter (L)</label>
            <input
              type="number"
              step="0.01"
              value={openingReading}
              onChange={(e) => setOpeningReading(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Closing Meter (L)</label>
            <input
              type="number"
              step="0.01"
              value={closingReading}
              onChange={(e) => setClosingReading(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Rate / Liter</label>
            <input
              type="number"
              step="0.01"
              value={ratePerLiter}
              onChange={(e) => setRatePerLiter(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Cash Collected</label>
            <input
              type="number"
              step="0.01"
              value={cashCollected}
              onChange={(e) => setCashCollected(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Notes</label>
            <input
              type="text"
              placeholder="Optional shift remarks"
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#2c3e50',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Save Shift Reconciliation
            </button>
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f9', textAlign: 'left' }}>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Shift</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Nozzle</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Open / Close</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>System (L)</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Var (L)</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Cash / Expected</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Cash Var</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{s.shiftName}</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{s.nozzleLabel}</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>
                    {s.openingReading} / {s.closingReading}
                  </td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{s.systemDispensedLiters} L</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{s.varianceLiters} L</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>
                    {s.cashCollected} / {s.expectedCash}
                  </td>
                  <td
                    style={{
                      padding: '9px',
                      borderBottom: '1px solid #eee',
                      fontWeight: '600',
                      color: Number(s.varianceCash) < 0 ? '#e74c3c' : '#27ae60',
                    }}
                  >
                    {s.varianceCash}
                  </td>
                <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>
                   <button
                   type="button"
                    onClick={() => handleDeleteShift(s.id)}
                     style={{
                    backgroundColor: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    padding: '5px 10px',
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
              {shifts.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '12px', textAlign: 'center', color: '#777' }}>
                    No shift reconciliations logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: 5L Calibration Log */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '22px',
          borderRadius: '10px',
          borderTop: '4px solid #3498db',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>5L Calibration Log</h2>
        <form
          onSubmit={handleSaveCalibration}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nozzle</label>
            <input
              type="text"
              value={calNozzle}
              onChange={(e) => setCalNozzle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Measured on 5.00L Test</label>
            <input
              type="number"
              step="0.01"
              value={measuredLiters}
              onChange={(e) => setMeasuredLiters(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Notes</label>
            <input
              type="text"
              placeholder="Optional calibration notes"
              value={calNotes}
              onChange={(e) => setCalNotes(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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
              Log 5L Calibration
            </button>
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f9', textAlign: 'left' }}>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Nozzle</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Standard</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Measured</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Variance</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Notes</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {calibrations.map((c) => (
                <tr key={c.id}>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{c.nozzleLabel}</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{c.standardLiters} L</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{c.measuredLiters} L</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>
                    {Number(c.varianceLiters) > 0 ? `+${c.varianceLiters}` : c.varianceLiters} L
                  </td>
                  <td
                    style={{
                      padding: '9px',
                      borderBottom: '1px solid #eee',
                      fontWeight: '600',
                      color: c.status === 'Pass' ? '#27ae60' : '#e74c3c',
                    }}
                  >
                    {c.status}
                  </td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>
  <button
    type="button"
    onClick={() => handleDeleteCalibration(c.id)}
    style={{
      backgroundColor: '#e74c3c',
      color: '#fff',
      border: 'none',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: '600',
    }}
  >
    Delete
  </button>
</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{c.notes || '-'}</td>
                </tr>
              ))}
              {calibrations.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '12px', textAlign: 'center', color: '#777' }}>
                    No 5L calibration logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Theft & Suspicious Activity Alerts */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '22px',
          borderRadius: '10px',
          borderTop: '4px solid #e74c3c',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Theft & Suspicious Activity Alerts</h2>
        <form
          onSubmit={handleCreateAlert}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Alert Type</label>
            <input
              type="text"
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', minWidth: '220px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Description</label>
            <input
              type="text"
              placeholder="Describe suspicious activity or discrepancy"
              value={alertDescription}
              onChange={(e) => setAlertDescription(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Log Suspicious Alert
            </button>
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f9', textAlign: 'left' }}>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Severity</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '9px', borderBottom: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee', fontWeight: '600' }}>{a.alertType}</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{a.severity}</td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee' }}>{a.description}</td>
                  <td
                    style={{
                      padding: '9px',
                      borderBottom: '1px solid #eee',
                      fontWeight: '600',
                      color: a.isResolved ? '#27ae60' : '#e74c3c',
                    }}
                  >
                    {a.isResolved ? 'Resolved' : 'Open'}
                  </td>
                  <td style={{ padding: '9px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                    {!a.isResolved && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(a.id)}
                        style={{
                          backgroundColor: '#27ae60',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          marginRight: '6px',
                        }}
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(a.id)}
                      style={{
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        padding: '5px 10px',
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
              {alerts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#777' }}>
                    No alerts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;