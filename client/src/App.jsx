import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManagePumps from './pages/ManagePumps';
import FuelInventory from './pages/FuelInventory';
import DailyReports from './pages/DailyReports';
import Settings from './pages/Settings';
import Fleet from './pages/Fleet';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/manage-pumps" element={<ManagePumps />} />
        <Route path="/fuel-inventory" element={<FuelInventory/>} />
        <Route path="/daily-reports" element={<DailyReports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/fleet" element={<Fleet />} />
      </Routes>
    </Router>
  );
}
export default App;