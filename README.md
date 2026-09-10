# FaceDetect Pro

A privacy-focused React face detection dashboard. Webcam frames and uploaded images are analyzed in the browser with `face-api.js`; no images are sent to the backend.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:4001](http://localhost:4001). Camera access works on `localhost` during development and requires HTTPS after deployment.

The Tiny Face Detector model is included in `frontend/public/models`, so the application can run without downloading model weights at runtime.

## Optional MongoDB history service

Detection history automatically uses the backend when it can reach MongoDB. If the backend or database is unavailable, FaceDetect Pro clearly indicates that it is using browser `localStorage` and remains functional.

```bash
cd backend
cp .env.example .env
# Set MONGODB_URI in .env if you are not using the provided local MongoDB URL.
npm install
npm run dev
```

The API runs at `http://localhost:6001`. It provides health, list, create, delete, and clear endpoints for detection records only; it never receives camera frames or source images.

## Main features

- Real-time webcam detection with fitted, confidence-labelled bounding boxes
- Image upload detection and detected-face overlay
- Webcam capture, detected image preview, and PNG download
- Detection dashboard, history, local/server persistence, and settings
- Light/dark theme, responsive navigation, and clear camera/model/image errors

## Verify production build

```bash
cd frontend
npm run lint
npm run build
```
