import { useDetectionHistory } from "../../context/DetectionContext";

function Navbar({ onMenuOpen }) {
  const { storageMode } = useDetectionHistory();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-button" type="button" aria-label="Open navigation" onClick={onMenuOpen}>☰</button>
        <div className="mobile-logo"><span>FD</span><strong>FaceDetect Pro</strong></div>
      </div>
      <div className="navbar-right">
        <span className={`storage-status ${storageMode}`}><i /> {storageMode === "server" ? "Cloud history" : "Local history"}</span>
        <div className="profile" aria-label="Local workspace">
          <div className="profile-avatar">FD</div>
          <div className="profile-info"><strong>Local workspace</strong><span>Private by design</span></div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
