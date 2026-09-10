import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearDetections,
  deleteDetection as deleteRemoteDetection,
  getDetections,
  sendDetection,
} from "../services/api";

const DetectionContext = createContext(null);
const HISTORY_KEY = "faceDetectHistory";

export const DEFAULT_SETTINGS = {
  confidenceThreshold: 50,
  detectionInterval: 250,
  autoDetection: true,
  showConfidence: true,
  theme: "light",
};

function readLocalStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function localRecord(values) {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    ...values,
  };
}

export function DetectionProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [storageMode, setStorageMode] = useState("server");
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...readLocalStorage("faceDetectSettings", {}),
  }));
  const [cameraStatus, setCameraStatus] = useState("inactive");

  const saveLocalHistory = useCallback((nextHistory) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (error) {
      console.error("Unable to cache detection history", error);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await getDetections();
      if (!response.success) throw new Error(response.message || "Server history unavailable");
      setHistory(response.data);
      setStorageMode("server");
      setHistoryError("");
    } catch (error) {
      console.warn("Using local detection history", error.message);
      setHistory(readLocalStorage(HISTORY_KEY, []));
      setStorageMode("local");
      setHistoryError("Server history is unavailable; results are being stored only in this browser.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const addDetection = useCallback(
    async ({ type, faces, confidence, imageName = "" }) => {
      const payload = {
        type,
        faces: Math.max(0, Math.round(Number(faces) || 0)),
        confidence: Math.max(0, Math.min(100, Number(confidence) || 0)),
        imageName,
      };

      if (storageMode === "server") {
        try {
          const response = await sendDetection(payload);
          if (!response.success) throw new Error(response.message || "Unable to save result");
          setHistory((previous) => [response.data, ...previous].slice(0, 100));
          return response.data;
        } catch {
          setStorageMode("local");
          setHistoryError("The server could not save this result. It was kept locally instead.");
        }
      }

      const record = localRecord(payload);
      setHistory((previous) => {
        const next = [record, ...previous].slice(0, 100);
        saveLocalHistory(next);
        return next;
      });
      return record;
    },
    [saveLocalHistory, storageMode],
  );

  const deleteDetection = useCallback(
    async (id) => {
      if (storageMode === "server") {
        try {
          await deleteRemoteDetection(id);
        } catch {
          setHistoryError("The server could not remove this record.");
          return;
        }
      }
      setHistory((previous) => {
        const next = previous.filter((item) => (item._id || item.id) !== id);
        if (storageMode === "local") saveLocalHistory(next);
        return next;
      });
    },
    [saveLocalHistory, storageMode],
  );

  const clearHistory = useCallback(async () => {
    if (storageMode === "server") {
      try {
        await clearDetections();
      } catch {
        setHistoryError("The server could not clear the history.");
        return;
      }
    }
    setHistory([]);
    if (storageMode === "local") saveLocalHistory([]);
  }, [saveLocalHistory, storageMode]);

  const saveSettings = useCallback((nextSettings) => {
    const normalized = { ...DEFAULT_SETTINGS, ...nextSettings };
    setSettings(normalized);
    localStorage.setItem("faceDetectSettings", JSON.stringify(normalized));
  }, []);

  const value = useMemo(
    () => ({
      history,
      historyLoading,
      historyError,
      storageMode,
      settings,
      cameraStatus,
      addDetection,
      deleteDetection,
      clearHistory,
      loadHistory,
      saveSettings,
      setCameraStatus,
    }),
    [
      addDetection,
      cameraStatus,
      clearHistory,
      deleteDetection,
      history,
      historyError,
      historyLoading,
      loadHistory,
      saveSettings,
      settings,
      storageMode,
    ],
  );

  return <DetectionContext.Provider value={value}>{children}</DetectionContext.Provider>;
}

export function useDetectionHistory() {
  const context = useContext(DetectionContext);
  if (!context) throw new Error("useDetectionHistory must be used inside DetectionProvider");
  return context;
}
