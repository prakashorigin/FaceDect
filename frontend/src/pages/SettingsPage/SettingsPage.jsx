import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, useDetectionHistory } from "../../context/DetectionContext";
import "./SettingsPage.css";

function SettingsPage() {
  const { settings, saveSettings } = useDetectionHistory();
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  const updateField = (event) => {
    const { name, type, checked, value } = event.target;
    setDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "theme" ? value : Number(value),
    }));
    setMessage("");
  };

  const save = () => {
    saveSettings(draft);
    setMessage("Settings saved. They will be used for future scans.");
  };

  const reset = () => {
    setDraft(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setMessage("Settings restored to their defaults.");
  };

  return (
    <div className="page-container settings-page">
      <div className="page-header">
        <div><span className="eyebrow">PREFERENCES</span><h1>Settings</h1><p>Fine-tune how FaceDetect Pro runs in your browser.</p></div>
      </div>
      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-section-title"><h2>Detection controls</h2><p>These settings apply to camera, capture, and uploaded-image analysis.</p></div>
          <label className="setting-row range-setting">
            <span><strong>Confidence threshold</strong><small>Ignore detections below this confidence score.</small></span>
            <span className="range-control"><input type="range" name="confidenceThreshold" min="10" max="95" value={draft.confidenceThreshold} onChange={updateField} /><b>{draft.confidenceThreshold}%</b></span>
          </label>
          <label className="setting-row">
            <span><strong>Detection interval</strong><small>More frequent scans are more responsive but use more processing power.</small></span>
            <select name="detectionInterval" value={draft.detectionInterval} onChange={updateField}>
              <option value="150">Fast · 150 ms</option><option value="250">Balanced · 250 ms</option><option value="500">Light · 500 ms</option><option value="1000">Low power · 1 second</option>
            </select>
          </label>
          <label className="setting-row">
            <span><strong>Automatic detection</strong><small>Continuously scan while your camera is running.</small></span>
            <input className="switch" type="checkbox" name="autoDetection" checked={draft.autoDetection} onChange={updateField} />
          </label>
          <label className="setting-row">
            <span><strong>Show confidence labels</strong><small>Show each face score above its bounding box.</small></span>
            <input className="switch" type="checkbox" name="showConfidence" checked={draft.showConfidence} onChange={updateField} />
          </label>
        </section>
        <aside className="settings-card appearance-card">
          <div className="settings-section-title"><h2>Appearance</h2><p>Choose the interface theme that suits your workspace.</p></div>
          <fieldset className="theme-options"><legend>Color theme</legend>
            <label className={`theme-choice ${draft.theme === "light" ? "selected" : ""}`}><input type="radio" name="theme" value="light" checked={draft.theme === "light"} onChange={updateField} /><span>☀</span> Light</label>
            <label className={`theme-choice ${draft.theme === "dark" ? "selected" : ""}`}><input type="radio" name="theme" value="dark" checked={draft.theme === "dark"} onChange={updateField} /><span>◐</span> Dark</label>
          </fieldset>
          <div className="settings-privacy"><span>⌁</span><p><strong>Privacy first</strong>Camera frames and source images are never uploaded for analysis. Only the small detection record can be saved to your configured history storage.</p></div>
        </aside>
      </div>
      <div className="settings-actions"><button type="button" className="button button-secondary" onClick={reset}>Reset defaults</button><button type="button" className="button button-primary" onClick={save}>Save settings</button></div>
      {message && <div className="settings-message" role="status">✓ {message}</div>}
    </div>
  );
}

export default SettingsPage;
