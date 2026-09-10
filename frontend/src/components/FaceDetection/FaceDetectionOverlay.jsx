import { useEffect, useRef } from "react";
import {
  getDetectionBox,
  getDetectionScore,
} from "../../services/faceDetection";
import "./FaceDetectionOverlay.css";

function FaceDetectionOverlay({ mediaRef, detections = [], showConfidence = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    if (!media || !canvas) return undefined;

    const draw = () => {
      const displayWidth = media.clientWidth;
      const displayHeight = media.clientHeight;
      const sourceWidth = media.videoWidth || media.naturalWidth;
      const sourceHeight = media.videoHeight || media.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context || !displayWidth || !displayHeight) return;

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.round(displayWidth * pixelRatio);
      canvas.height = Math.round(displayHeight * pixelRatio);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, displayWidth, displayHeight);
      if (!sourceWidth || !sourceHeight) return;

      // The media is rendered with object-fit: contain. Use the same fitted
      // rectangle here so boxes remain correct for both 4:3 and 16:9 sources.
      const scale = Math.min(displayWidth / sourceWidth, displayHeight / sourceHeight);
      const offsetX = (displayWidth - sourceWidth * scale) / 2;
      const offsetY = (displayHeight - sourceHeight * scale) / 2;
      detections.forEach((detection, index) => {
        const box = getDetectionBox(detection);
        if (!box) return;

        const score = getDetectionScore(detection);
        const color = score >= 0.8 ? "#4ade80" : score >= 0.6 ? "#fbbf24" : "#fb7185";
        const x = offsetX + box.x * scale;
        const y = offsetY + box.y * scale;
        const width = box.width * scale;
        const height = box.height * scale;
        const label = showConfidence
          ? `Face ${index + 1} · ${(score * 100).toFixed(1)}%`
          : `Face ${index + 1}`;

        context.strokeStyle = color;
        context.lineWidth = 2.5;
        context.shadowColor = "rgba(0, 0, 0, 0.45)";
        context.shadowBlur = 8;
        context.strokeRect(x, y, width, height);
        context.shadowBlur = 0;
        context.font = "600 12px Inter, system-ui, sans-serif";
        const labelWidth = context.measureText(label).width + 16;
        const labelHeight = 25;
        const labelY = Math.max(0, y - labelHeight);
        context.fillStyle = color;
        context.fillRect(x, labelY, labelWidth, labelHeight);
        context.fillStyle = "#07111f";
        context.fillText(label, x + 8, labelY + 16.5);
      });
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(media);
    media.addEventListener("loadedmetadata", draw);
    media.addEventListener("load", draw);
    window.addEventListener("resize", draw);
    return () => {
      observer.disconnect();
      media.removeEventListener("loadedmetadata", draw);
      media.removeEventListener("load", draw);
      window.removeEventListener("resize", draw);
    };
  }, [detections, mediaRef, showConfidence]);

  return <canvas ref={canvasRef} className="face-detection-canvas" aria-hidden="true" />;
}

export default FaceDetectionOverlay;
