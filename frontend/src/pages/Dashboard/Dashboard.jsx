import { Link } from "react-router-dom";
import Camera from "../../components/Camera/Camera";
import { useDetectionHistory } from "../../context/DetectionContext";

function recordDate(record) {
  return new Date(record.createdAt || record.date).toLocaleString([], {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function Dashboard() {
  const { history, historyLoading, cameraStatus, storageMode } = useDetectionHistory();
  const totalFaces = history.reduce((total, item) => total + (Number(item.faces) || 0), 0);
  const averageConfidence = history.length
    ? history.reduce((total, item) => total + (Number(item.confidence) || 0), 0) / history.length
    : 0;
  const cards = [
    { label: "Total detections", value: history.length, helper: "Recorded analysis runs", icon: "◫" },
    { label: "Faces detected", value: totalFaces, helper: "Across all sessions", icon: "◎" },
    { label: "Average confidence", value: `${averageConfidence.toFixed(1)}%`, helper: "Across detected records", icon: "◈" },
    { label: "Camera status", value: cameraStatus === "active" ? "Active" : "Ready", helper: storageMode === "server" ? "Server history connected" : "Using local history", icon: "◉", active: cameraStatus === "active" },
  ];

  return (
    <div className="dashboard page-container">
      <div className="dashboard-header">
        <div><span className="eyebrow">OVERVIEW</span><h1>Detection dashboard</h1><p>Run fast face detection without sending camera frames to a server.</p></div>
        <div className="dashboard-actions"><Link className="button button-secondary" to="/upload">Upload image</Link><Link className="button button-primary" to="/camera">Open camera</Link></div>
      </div>

      <section className="stats-grid" aria-label="Detection statistics">
        {cards.map((card) => <article className="stat-card" key={card.label}><div className={`stat-icon ${card.active ? "active" : ""}`}>{card.icon}</div><div><span>{card.label}</span><h2>{card.value}</h2><p>{card.helper}</p></div></article>)}
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-card camera-card"><Camera /></section>
        <section className="dashboard-card activity-card">
          <div className="card-header"><div><span className="eyebrow">ACTIVITY</span><h2>Recent detections</h2></div><Link to="/history">View all</Link></div>
          {historyLoading ? <div className="activity-empty"><div className="activity-empty-icon">⋯</div><h3>Loading history</h3><p>Retrieving your saved detection results.</p></div>
            : history.length === 0 ? <div className="activity-empty"><div className="activity-empty-icon">◷</div><h3>No activity yet</h3><p>Run a camera scan or upload an image to see it here.</p></div>
              : <div className="activity-list">{history.slice(0, 6).map((item) => <div className="activity-item" key={item._id || item.id}><div className="activity-icon">{item.type === "Upload" ? "↥" : item.type === "Capture" ? "◈" : "◉"}</div><div className="activity-content"><strong>{item.type} detection</strong><span>{item.faces} {item.faces === 1 ? "face" : "faces"} · {Number(item.confidence).toFixed(1)}%</span><small>{recordDate(item)}</small></div></div>)}</div>}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
