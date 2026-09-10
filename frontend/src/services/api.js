import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:6001/api",
  timeout: 5000,
});

async function request(method, url, data) {
  const response = await client({ method, url, data });
  return response.data;
}

export function getDetections() {
  return request("get", "/detections");
}

export function sendDetection(detection) {
  return request("post", "/detections", detection);
}

export function deleteDetection(id) {
  return request("delete", `/detections/${id}`);
}

export function clearDetections() {
  return request("delete", "/detections");
}
