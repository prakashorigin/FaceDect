const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDatabase, isDatabaseReady } = require("./config/database");
const detectionRoutes = require("./routes/detectionRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 6001;

app.use(
  cors({ origin: process.env.FRONTEND_ORIGIN || ["http://localhost:4001", "http://127.0.0.1:4001"] }),
);
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    success: true,
    message: "FaceDetect Pro Backend is running",
    database: isDatabaseReady() ? "connected" : "unavailable",
  });
});

app.use("/api/detections", detectionRoutes);
app.use("/api/detection", detectionRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  const status = error.name === "CastError" ? 400 : 500;
  response.status(status).json({
    success: false,
    message: status === 400 ? "Invalid detection record id." : "The server could not process that request.",
  });
});

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`FaceDetect Pro Backend: http://localhost:${PORT}`);
    console.log(`Health API: http://localhost:${PORT}/api/health`);
  });
});
