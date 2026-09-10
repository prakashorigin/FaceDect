import { useDetectionHistory } from "../../context/DetectionContext";
import "./HistoryPage.css";

function recordDate(record) {
  return new Date(record.createdAt || record.date).toLocaleString();
}

function typeIcon(type) {
  return type === "Upload" ? "↥" : type === "Capture" ? "◈" : "◉";
}

function HistoryPage() {
  const { history, historyLoading, historyError, storageMode, deleteDetection, clearHistory, loadHistory } = useDetectionHistory();
  const totalFaces = history.reduce((total, item) => total + (Number(item.faces) || 0), 0);
  const averageConfidence = history.length ? history.reduce((total, item) => total + (Number(item.confidence) || 0), 0) / history.length : 0;

  if (historyLoading) {
    return <div className="page-container"><div className="page-header"><div><span className="eyebrow">RECORDS</span><h1>Detection history</h1><p>Loading your saved results…</p></div></div><div className="history-loading">Loading history</div></div>;
  }

  return (
    <div className="history-page page-container">
      <div className="history-header">
        <div><span className="eyebrow">RECORDS</span><h1>Detection history</h1><p>Review the latest 100 local or server-saved detection records.</p></div>
        <div className="history-actions"><button className="button button-secondary" type="button" onClick={loadHistory}>Refresh</button>{history.length > 0 && <button className="button button-danger" type="button" onClick={clearHistory}>Clear history</button>}</div>
      </div>
      {historyError && <div className="history-error"><span>!</span><p>{historyError}</p></div>}
      <div className="history-summary">
        <div className="summary-card"><span>Total detections</span><strong>{history.length}</strong></div><div className="summary-card"><span>Total faces</span><strong>{totalFaces}</strong></div><div className="summary-card"><span>Average confidence</span><strong>{averageConfidence.toFixed(1)}%</strong></div><div className="summary-card"><span>Storage</span><strong className="storage-value">{storageMode === "server" ? "Server" : "Browser"}</strong></div>
      </div>
      {history.length === 0 ? <div className="empty-history"><div className="empty-icon">◷</div><h2>No detection history</h2><p>Camera and image analysis results will appear here.</p></div>
        : <div className="history-card"><div className="history-table-wrapper"><table className="history-table"><thead><tr><th>Date & time</th><th>Type</th><th>Source</th><th>Faces</th><th>Confidence</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{history.map((item) => <tr key={item._id || item.id}><td><time>{recordDate(item)}</time></td><td><span className="detection-type"><i>{typeIcon(item.type)}</i>{item.type}</span></td><td><span className="image-name">{item.imageName || "Live camera"}</span></td><td><span className="face-count">{item.faces}</span></td><td><span className="confidence">{Number(item.confidence).toFixed(1)}%</span></td><td><button className="delete-history-btn" type="button" aria-label="Delete detection" onClick={() => deleteDetection(item._id || item.id)}>×</button></td></tr>)}</tbody></table></div></div>}
    </div>
  );
}

export default HistoryPage;
