import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManagePumps from './pages/ManagePumps';
import FuelInventory from './pages/FuelInventory';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/manage-pumps" element={<ManagePumps />} />
        <Route path="/fuel-inventory" element={<FuelInventory/>} />
      </Routes>
    </Router>
  );
}
export default App;