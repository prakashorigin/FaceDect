import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CameraPage from "./pages/CameraPage/CameraPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import HistoryPage from "./pages/HistoryPage/HistoryPage";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import UploadPage from "./pages/UploadPage/UploadPage";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app">
        {menuOpen && <button className="nav-backdrop" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
        <Sidebar isOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <div className="main-wrapper">
          <Navbar onMenuOpen={() => setMenuOpen(true)} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/camera" element={<CameraPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
