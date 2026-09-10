import { useCallback, useEffect, useRef, useState } from "react";
import FaceDetectionOverlay from "../FaceDetection/FaceDetectionOverlay";
import { useDetectionHistory } from "../../context/DetectionContext";
import {
  detectFaces,
  loadFaceDetector,
  summarizeDetections,
} from "../../services/faceDetection";
import "./Camera.css";

function cameraErrorMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Camera permission was denied. Allow access in your browser settings, then try again.";
  }
  if (error?.name === "NotFoundError") return "No camera was found on this device.";
  if (error?.name === "NotReadableError") {
    return "The camera is busy in another application. Close it and try again.";
  }
  if (!window.isSecureContext) return "Camera access requires HTTPS or localhost.";
  return "The camera could not be started. Please try again.";
}

function Camera() {
  const videoRef = useRef(null);
  const capturedImageRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const detectingRef = useRef(false);
  const activeRef = useRef(false);
  const sessionRef = useRef({ hasRun: false, faces: 0, confidence: 0 });

  const { addDetection, settings, setCameraStatus } = useDetectionHistory();
  const [modelState, setModelState] = useState("loading");
  const [cameraActive, setCameraActive] = useState(false);
  const [detections, setDetections] = useState([]);
  const [summary, setSummary] = useState({ faces: 0, confidence: 0 });
  const [fps, setFps] = useState(0);
  const [error, setError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(null);

  useEffect(() => {
    let mounted = true;
    loadFaceDetector()
      .then(() => mounted && setModelState("ready"))
      .catch((loadError) => {
        console.error("Face model failed to load", loadError);
        if (mounted) {
          setModelState("error");
          setError("The face detection model could not load. Refresh the page and check your connection.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stopCamera = useCallback(
    ({ saveSession = true } = {}) => {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      activeRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;

      if (saveSession && sessionRef.current.hasRun) {
        addDetection({
          type: "Camera",
          faces: sessionRef.current.faces,
          confidence: sessionRef.current.confidence,
          imageName: "Live camera session",
        });
      }

      sessionRef.current = { hasRun: false, faces: 0, confidence: 0 };
      setCameraActive(false);
      setCameraStatus("inactive");
      setDetections([]);
      setSummary({ faces: 0, confidence: 0 });
      setFps(0);
    },
    [addDetection, setCameraStatus],
  );

  useEffect(() => () => stopCamera({ saveSession: true }), [stopCamera]);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || detectingRef.current) {
      return null;
    }

    detectingRef.current = true;
    const startedAt = performance.now();
    try {
      const results = await detectFaces(video, settings.confidenceThreshold);
      const nextSummary = summarizeDetections(results);
      setDetections(results);
      setSummary(nextSummary);
      setFps(Math.max(1, Math.round(1000 / Math.max(performance.now() - startedAt, 1))));
      sessionRef.current = { hasRun: true, ...nextSummary };
      return { results, ...nextSummary };
    } catch (scanError) {
      console.error("Face scan failed", scanError);
      setError("Face detection paused because a frame could not be analyzed. Try restarting the camera.");
      return null;
    } finally {
      detectingRef.current = false;
    }
  }, [settings.confidenceThreshold]);

  useEffect(() => {
    if (!cameraActive || modelState !== "ready" || !settings.autoDetection) {
      return undefined;
    }

    let cancelled = false;
    const scheduleScan = async () => {
      await scanFrame();
      if (!cancelled && activeRef.current) {
        timerRef.current = window.setTimeout(scheduleScan, settings.detectionInterval);
      }
    };
    scheduleScan();

    return () => {
      cancelled = true;
      window.clearTimeout(timerRef.current);
    };
  }, [cameraActive, modelState, scanFrame, settings.autoDetection, settings.detectionInterval]);

  const startCamera = async () => {
    if (modelState !== "ready") {
      setError("The face detection model is still loading. Please wait a moment.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera access.");
      return;
    }

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      activeRef.current = true;
      setCameraActive(true);
      setCameraStatus("active");
      sessionRef.current = { hasRun: false, faces: 0, confidence: 0 };
    } catch (cameraError) {
      console.error("Camera start failed", cameraError);
      setError(cameraErrorMessage(cameraError));
      stopCamera({ saveSession: false });
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !cameraActive || !video.videoWidth) return;

    setIsCapturing(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

      const results = await detectFaces(canvas, settings.confidenceThreshold);
      const captureSummary = summarizeDetections(results);
      const dataUrl = canvas.toDataURL("image/png");
      stopCamera({ saveSession: false });
      setCaptured({ dataUrl, detections: results, ...captureSummary });
      addDetection({
        type: "Capture",
        faces: captureSummary.faces,
        confidence: captureSummary.confidence,
        imageName: "Camera capture.png",
      });
    } catch (captureError) {
      console.error("Capture failed", captureError);
      setError("The image could not be captured or analyzed. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadCapture = () => {
    if (!captured?.dataUrl) return;
    const link = document.createElement("a");
    link.href = captured.dataUrl;
    link.download = `facedetect-capture-${Date.now()}.png`;
    link.click();
  };

  const modelLabel =
    modelState === "ready" ? "AI ready" : modelState === "error" ? "AI unavailable" : "Loading AI";
  const detectionStatus = !cameraActive
    ? "Camera off"
    : summary.faces > 0
      ? "Faces found"
      : "Scanning";

  return (
    <section className="camera-panel" aria-label="Live face detection">
      <div className="camera-panel-heading">
        <div>
          <span className="eyebrow">LIVE ANALYSIS</span>
          <h2>Camera workspace</h2>
          <p>All processing stays in this browser.</p>
        </div>
        <span className={`model-chip ${modelState}`}><i /> {modelLabel}</span>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>!</span><p>{error}</p>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      {captured ? (
        <div className="capture-layout">
          <div className="media-stage capture-stage">
            <img ref={capturedImageRef} src={captured.dataUrl} alt="Captured camera frame with face detections" />
            <FaceDetectionOverlay mediaRef={capturedImageRef} detections={captured.detections} showConfidence={settings.showConfidence} />
          </div>
          <aside className="capture-summary">
            <span className="eyebrow">CAPTURE COMPLETE</span>
            <h3>Photo analyzed</h3>
            <p>{captured.faces ? "Detection results are marked on the image." : "No faces met the confidence threshold."}</p>
            <div className="result-metrics">
              <div><span>Faces</span><strong>{captured.faces}</strong></div>
              <div><span>Confidence</span><strong>{captured.confidence.toFixed(1)}%</strong></div>
            </div>
            <button className="button button-primary" type="button" onClick={downloadCapture}>Download PNG</button>
            <button className="button button-secondary" type="button" onClick={() => setCaptured(null)}>New camera session</button>
          </aside>
        </div>
      ) : (
        <>
          <div className="media-stage camera-stage">
            <video ref={videoRef} autoPlay muted playsInline />
            <FaceDetectionOverlay mediaRef={videoRef} detections={detections} showConfidence={settings.showConfidence} />
            {cameraActive && <div className="scanner-line" aria-hidden="true" />}
            {!cameraActive && (
              <div className="camera-empty-state">
                <div className="camera-glyph">◉</div><h3>Ready when you are</h3>
                <p>Start your camera to begin secure, local face detection.</p>
              </div>
            )}
            <span className={`camera-live-state ${cameraActive ? "active" : ""}`}><i /> {cameraActive ? detectionStatus : "Offline"}</span>
          </div>

          <div className="camera-stat-grid">
            <div><span>Faces detected</span><strong>{summary.faces}</strong></div>
            <div><span>Average confidence</span><strong>{summary.confidence.toFixed(1)}%</strong></div>
            <div><span>Detection speed</span><strong>{fps ? `${fps} FPS` : "—"}</strong></div>
            <div><span>System status</span><strong className={cameraActive ? "positive" : "muted"}>{detectionStatus}</strong></div>
          </div>
        </>
      )}

      {!captured && (
        <div className="camera-controls">
          {!cameraActive ? (
            <button className="button button-primary" type="button" onClick={startCamera} disabled={modelState !== "ready"}>
              {modelState === "loading" ? "Loading model…" : "Start camera"}
            </button>
          ) : (
            <>
              {!settings.autoDetection && <button className="button button-secondary" type="button" onClick={scanFrame}>Scan frame</button>}
              <button className="button button-primary" type="button" onClick={capturePhoto} disabled={isCapturing}>{isCapturing ? "Capturing…" : "Capture photo"}</button>
              <button className="button button-danger" type="button" onClick={() => stopCamera()}>Stop camera</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default Camera;
