import * as faceapi from "face-api.js";

let detectorPromise;

const modelUrl = `${import.meta.env.BASE_URL}models`;

export async function loadFaceDetector() {
  if (faceapi.nets.tinyFaceDetector.isLoaded) return;

  if (!detectorPromise) {
    detectorPromise = faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl).catch(
      (error) => {
        detectorPromise = undefined;
        throw error;
      },
    );
  }

  await detectorPromise;
}

export function detectorOptions(confidenceThreshold) {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: confidenceThreshold / 100,
  });
}

export async function detectFaces(source, confidenceThreshold) {
  return faceapi.detectAllFaces(source, detectorOptions(confidenceThreshold));
}

export function getDetectionBox(detection) {
  return detection.box || detection.detection?.box;
}

export function getDetectionScore(detection) {
  return detection.score ?? detection.detection?.score ?? 0;
}

export function summarizeDetections(detections) {
  if (!detections.length) return { faces: 0, confidence: 0 };

  const confidence =
    (detections.reduce((total, item) => total + getDetectionScore(item), 0) /
      detections.length) *
    100;

  return { faces: detections.length, confidence };
}
