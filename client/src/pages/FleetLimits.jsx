import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

function FleetLimits() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [monthlyLimitLiters, setMonthlyLimitLiters] = useState('500');
  const [windowStart, setWindowStart] = useState('06:00');
  const [windowEnd, setWindowEnd] = useState('22:00');
  const [maxDailyRefuels, setMaxDailyRefuels] = useState('2');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const [savedRules, setSavedRules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pumpsync_fleet_limits') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/fleet/vehicles', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (Array.isArray(res.data)) {
          setVehicles(res.data);
        }
      } catch {
        // Fallback sample vehicles if endpoint is not yet added
        setVehicles([
          { id: 'VEH-01', label: 'Truck - LEA-4521 (Diesel)' },
          { id: 'VEH-02', label: 'Loader - RWP-8810 (Diesel)' },
          { id: 'VEH-03', label: 'Van - MN-3092 (Petrol)' },
        ]);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    localStorage.setItem('pumpsync_fleet_limits', JSON.stringify(savedRules));
  }, [savedRules]);

  const handleSaveRule = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setIsError(false);

    const targetId = selectedVehicle || 'ALL_FLEET';
    const targetLabel =
      vehicles.find((v) => String(v.id) === String(selectedVehicle))?.label ||
      'All Fleet Vehicles';

    const newRule = {
      id: Date.now(),
      vehicleId: targetId,
      vehicleLabel: targetLabel,
      monthlyLimitLiters: Number(monthlyLimitLiters),
      windowStart,
      windowEnd,
      maxDailyRefuels: Number(maxDailyRefuels),
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/fleet/limits', newRule, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Keep local state working even if backend route is pending
    }

    setSavedRules((prev) => {
      const filtered = prev.filter((r) => r.vehicleId !== targetId);
      return [newRule, ...filtered];
    });

    setStatusMsg('Fuel limit and time window saved successfully.');
    setIsError(false);
  };

  const handleDeleteRule = (id) => {
    setSavedRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-brand">PumpSync</div>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/dashboard')}>Overview</li>
          <li onClick={() => navigate('/fleet')}>Drivers & Vehicles</li>
          <li className="active">Fuel Limits & Time Windows</li>
          <li onClick={() => navigate('/daily-reports')}>Company Transactions</li>
          <li onClick={() => navigate('/settings')}>Settings</li>
        </ul>
      </div>

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-welcome">
            <span>
              Fleet Limits & Time Windows (<span className="role-badge">Fleet Manager</span>)
            </span>
          </div>
          <button className="logout-button" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div className="dashboard-content">
          <h2 className="dashboard-title">Fuel Limits & Allowed Time Windows</h2>

          <form
            onSubmit={handleSaveRule}
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Vehicle / Scope
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="">All Fleet Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label || v.vehicle_number || v.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Monthly Limit (Liters)
              </label>
              <input
                type="number"
                min="1"
                value={monthlyLimitLiters}
                onChange={(e) => setMonthlyLimitLiters(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Window Start Time
              </label>
              <input
                type="time"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Window End Time
              </label>
              <input
                type="time"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Max Refuels / 24h
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxDailyRefuels}
                onChange={(e) => setMaxDailyRefuels(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Rule
              </button>
            </div>
          </form>

          {statusMsg && (
            <p style={{ color: isError ? '#dc2626' : '#16a34a', fontWeight: 600, marginBottom: '16px' }}>
              {statusMsg}
            </p>
          )}

          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ marginBottom: '12px' }}>Active Fuel Limit & Time Window Rules</h3>
            {savedRules.length === 0 ? (
              <p style={{ color: '#64748b' }}>No rules configured yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px' }}>Vehicle / Scope</th>
                    <th style={{ padding: '10px' }}>Monthly Limit</th>
                    <th style={{ padding: '10px' }}>Allowed Time Window</th>
                    <th style={{ padding: '10px' }}>24h Cap</th>
                    <th style={{ padding: '10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRules.map((rule) => (
                    <tr key={rule.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>{rule.vehicleLabel}</td>
                      <td style={{ padding: '10px' }}>{rule.monthlyLimitLiters} L</td>
                      <td style={{ padding: '10px' }}>
                        {rule.windowStart} - {rule.windowEnd}
                      </td>
                      <td style={{ padding: '10px' }}>{rule.maxDailyRefuels}x</td>
                      <td style={{ padding: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          style={{
                            padding: '5px 10px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FleetLimits;