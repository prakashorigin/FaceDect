const express = require("express");
const {
  clearDetections,
  createDetection,
  listDetections,
  removeDetection,
} = require("../controllers/detectionController");
const { isDatabaseReady } = require("../config/database");

const router = express.Router();

router.use((_request, response, next) => {
  if (!isDatabaseReady()) {
    return response.status(503).json({
      success: false,
      message: "MongoDB is unavailable. Configure MONGODB_URI and restart the backend.",
    });
  }
  return next();
});

router.route("/").get(listDetections).post(createDetection).delete(clearDetections);
router.post("/analyze", createDetection);
router.delete("/:id", removeDetection);

module.exports = router;
