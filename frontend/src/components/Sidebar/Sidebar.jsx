import { NavLink } from "react-router-dom";
import faceLogo from "../../assets/facestructurelogo.svg";

const mainLinks = [
  { to: "/", label: "Dashboard", icon: "▦", end: true },
  { to: "/camera", label: "Live camera", icon: "◉" },
  { to: "/upload", label: "Upload image", icon: "↥" },
];
const managementLinks = [
  { to: "/history", label: "Detection history", icon: "◷" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

function Sidebar({ isOpen, onNavigate }) {
  const renderLink = ({ to, label, icon, end }) => (
    <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
      <span className="nav-icon">{icon}</span>{label}
    </NavLink>
  );

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-brand"><img src={faceLogo} alt="FaceDetect Pro" /></div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-title">WORKSPACE</p>{mainLinks.map(renderLink)}
        <p className="nav-title">MANAGEMENT</p>{managementLinks.map(renderLink)}
      </nav>
      <div className="sidebar-bottom"><span className="status-indicator" /><div><strong>Private processing</strong><span>Images stay on-device</span></div></div>
    </aside>
  );
}

export default Sidebar;
