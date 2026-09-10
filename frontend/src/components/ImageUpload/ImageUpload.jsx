import { useEffect, useRef, useState } from "react";
import FaceDetectionOverlay from "../FaceDetection/FaceDetectionOverlay";
import { useDetectionHistory } from "../../context/DetectionContext";
import {
  detectFaces,
  loadFaceDetector,
  summarizeDetections,
} from "../../services/faceDetection";
import faceSymbols from "../../assets/facedectsymbols.jpeg";
import "./ImageUpload.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ImageUpload() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const objectUrlRef = useRef("");
  const { addDetection, settings } = useDetectionHistory();
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [detections, setDetections] = useState([]);
  const [summary, setSummary] = useState({ faces: 0, confidence: 0 });
  const [modelState, setModelState] = useState("loading");
  const [resultState, setResultState] = useState("idle");
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFaceDetector()
      .then(() => setModelState("ready"))
      .catch((loadError) => {
        console.error("Face model failed to load", loadError);
        setModelState("error");
        setError("The face detection model could not load. Refresh the page and try again.");
      });

    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const chooseFile = () => fileInputRef.current?.click();

  const selectFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, or WEBP image file.");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const nextUrl = URL.createObjectURL(selectedFile);
    objectUrlRef.current = nextUrl;
    setFile(selectedFile);
    setImageUrl(nextUrl);
    setDetections([]);
    setSummary({ faces: 0, confidence: 0 });
    setResultState("idle");
    setError("");
  };

  const handleImageSelect = (event) => selectFile(event.target.files?.[0]);

  const handleDrop = (event) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files?.[0]);
  };

  const detectImage = async () => {
    if (!imageRef.current || !imageUrl) {
      setError("Choose an image before running detection.");
      return;
    }
    if (modelState !== "ready") {
      setError("The face detection model is still loading. Please wait a moment.");
      return;
    }

    setIsDetecting(true);
    setError("");
    try {
      const results = await detectFaces(imageRef.current, settings.confidenceThreshold);
      const nextSummary = summarizeDetections(results);
      setDetections(results);
      setSummary(nextSummary);
      setResultState(results.length ? "found" : "empty");
      await addDetection({
        type: "Upload",
        faces: nextSummary.faces,
        confidence: nextSummary.confidence,
        imageName: file?.name || "Uploaded image",
      });
    } catch (detectError) {
      console.error("Image detection failed", detectError);
      setError("The image could not be analyzed. Try another valid image.");
    } finally {
      setIsDetecting(false);
    }
  };

  const removeImage = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
    setFile(null);
    setImageUrl("");
    setDetections([]);
    setSummary({ faces: 0, confidence: 0 });
    setResultState("idle");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = file?.name || "face-detection-image";
    link.click();
  };

  const resultLabel = resultState === "found"
    ? "Faces found"
    : resultState === "empty"
      ? "No faces found"
      : "Ready to scan";

  return (
    <section className="image-upload-wrapper" aria-label="Image face detection">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageSelect}
        hidden
      />

      {!imageUrl ? (
        <div
          className="upload-dropzone"
          onClick={chooseFile}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => event.key === "Enter" && chooseFile()}
        >
          <div className="upload-copy">
            <span className="eyebrow">IMAGE ANALYSIS</span>
            <div className="upload-icon">↥</div>
            <h2>Drop an image here</h2>
            <p>Or choose one from your device. Your image stays in this browser.</p>
            <button className="button button-primary" type="button" onClick={(event) => { event.stopPropagation(); chooseFile(); }}>
              Choose image
            </button>
            <small>JPG, PNG, or WEBP · maximum 10 MB</small>
          </div>
          <img className="upload-symbols" src={faceSymbols} alt="Face detection symbols" />
        </div>
      ) : (
        <div className="image-analysis">
          <article className="image-preview-section">
            <div className="section-header">
              <div>
                <span className="eyebrow">SOURCE IMAGE</span>
                <h2>Preview</h2>
                <p title={file?.name}>{file?.name}</p>
              </div>
              <button className="button button-secondary" type="button" onClick={removeImage}>Remove</button>
            </div>
            <div className="uploaded-image-container">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Uploaded for face detection"
                className="uploaded-image"
                onError={() => setError("The selected image could not be loaded.")}
              />
              <FaceDetectionOverlay mediaRef={imageRef} detections={detections} showConfidence={settings.showConfidence} />
            </div>
          </article>

          <aside className="image-results">
            <div className="results-heading">
              <span className="eyebrow">DETECTION RESULTS</span>
              <span className={`result-pill ${resultState}`}>{resultLabel}</span>
            </div>
            <div className="result-card"><span>Faces detected</span><strong>{summary.faces}</strong></div>
            <div className="result-card"><span>Average confidence</span><strong>{summary.confidence.toFixed(1)}%</strong></div>
            <p className="results-note">
              {resultState === "empty"
                ? "Try a clear, well-lit image with faces facing the camera."
                : "Detection results are saved to your history."}
            </p>
            <div className="result-actions">
              <button className="button button-primary" type="button" onClick={detectImage} disabled={isDetecting || modelState !== "ready"}>
                {isDetecting ? "Analyzing…" : modelState === "loading" ? "Loading AI…" : "Detect faces"}
              </button>
              <button className="button button-secondary" type="button" onClick={downloadImage}>Download original</button>
            </div>
          </aside>
        </div>
      )}

      {error && <div className="alert alert-error upload-error" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError("")} aria-label="Dismiss message">×</button></div>}
    </section>
  );
}

export default ImageUpload;
