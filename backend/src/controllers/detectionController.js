const Detection = require("../models/Detection");

function parseDetection(body) {
  const type = String(body.type || "").trim();
  const faces = Number(body.faces);
  const confidence = Number(body.confidence);
  const imageName = typeof body.imageName === "string" ? body.imageName.trim() : "";

  if (!["Camera", "Capture", "Upload"].includes(type)) {
    return { error: "type must be Camera, Capture, or Upload." };
  }
  if (!Number.isInteger(faces) || faces < 0 || faces > 100) {
    return { error: "faces must be a whole number between 0 and 100." };
  }
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
    return { error: "confidence must be a number between 0 and 100." };
  }
  return { value: { type, faces, confidence, imageName } };
}

async function listDetections(_request, response, next) {
  try {
    const detections = await Detection.find().sort({ createdAt: -1 }).limit(100).lean();
    response.json({ success: true, data: detections });
  } catch (error) { next(error); }
}

async function createDetection(request, response, next) {
  const parsed = parseDetection(request.body || {});
  if (parsed.error) return response.status(400).json({ success: false, message: parsed.error });

  try {
    const detection = await Detection.create(parsed.value);
    return response.status(201).json({ success: true, data: detection });
  } catch (error) { return next(error); }
}

async function removeDetection(request, response, next) {
  try {
    const detection = await Detection.findByIdAndDelete(request.params.id);
    if (!detection) return response.status(404).json({ success: false, message: "Detection record not found." });
    return response.json({ success: true, data: { id: request.params.id } });
  } catch (error) { return next(error); }
}

async function clearDetections(_request, response, next) {
  try {
    const result = await Detection.deleteMany({});
    response.json({ success: true, data: { deleted: result.deletedCount } });
  } catch (error) { next(error); }
}

module.exports = { clearDetections, createDetection, listDetections, removeDetection };
