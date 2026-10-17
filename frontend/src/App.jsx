
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  UploadCloud,
  LayoutDashboard,
  History,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/analyze";

function extractPredictions(payload) {
  const output = payload?.result;
  const entries = Array.isArray(output) ? output : [output];

  return entries.flatMap((entry) => {
    const value = entry?.predictions;

    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.predictions)) {
      return value.predictions;
    }

    return [];
  });
}

function extractAnnotatedImage(payload) {
  const output = payload?.result;
  const entries = Array.isArray(output) ? output : [output];

  for (const entry of entries) {
    const value = entry?.output_image;
    const image = Array.isArray(value) ? value[0] : value;

    if (typeof image === "string") {
      if (image.startsWith("data:image/")) return image;
      if (image.startsWith("http")) return image;

      return `data:image/jpeg;base64,${image}`;
    }

    if (image?.value) {
      const format = image.format || "jpeg";
      return `data:image/${format};base64,${image.value}`;
    }
  }

  return null;
}

function App() {
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    return () => {
      if (image?.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const predictions = result
    ? extractPredictions(result)
    : [];

  const annotatedImage = result
    ? extractAnnotatedImage(result)
    : null;

  const violations = predictions.filter((item) =>
    ["no-hardhat", "no-safety-vest"].includes(
      String(item.class || "").toLowerCase()
    )
  );

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    setImage(URL.createObjectURL(file));
    setSelectedFile(file);
    setResult(null);
    setError("");
    setActivePage("dashboard");
    event.target.value = "";
  }

  async function analyzeImage() {
    if (!selectedFile || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Analysis failed."
        );
      }

      setResult(data);

      const detected = extractPredictions(data);
      const flagged = detected.filter((item) =>
        ["no-hardhat", "no-safety-vest"].includes(
          String(item.class || "").toLowerCase()
        )
      );

      setHistory((previous) => [
        {
          id: crypto.randomUUID(),
          filename: selectedFile.name,
          date: new Date().toLocaleString(),
          detections: detected.length,
          violations: flagged.length,
          image: URL.createObjectURL(selectedFile),
          annotatedImage: extractAnnotatedImage(data),
        },
        ...previous,
      ]);
    } catch (err) {
      setError(err.message || "Unable to connect to the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>
          <ShieldCheck size={28} />
          VisionGuard
        </h2>

        <p className="sidebar-label">WORKSPACE</p>

        <nav>
          <div
            className={`nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActivePage("dashboard")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setActivePage("dashboard");
            }}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </div>

          <div
            className={`nav-item ${
              activePage === "history" ? "active" : ""
            }`}
            onClick={() => setActivePage("history")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setActivePage("history");
            }}
          >
            <History size={19} />
            History
          </div>
        </nav>

        <div className="sidebar-footer">
          Powered by Roboflow
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <p className="eyebrow">AI SAFETY PLATFORM</p>
            <h1>
              {activePage === "dashboard"
                ? "Safety Detection Dashboard"
                : "Analysis History"}
            </h1>
            <p className="subtitle">
              {activePage === "dashboard"
                ? "Analyze workplace images using computer vision."
                : "Review previously analyzed images."}
            </p>
          </div>

          <span className="status">
            ● {result ? "AI Connected" : "Platform Ready"}
          </span>
        </header>

        {activePage === "dashboard" ? (
          <>
            <section className="stats">
              <div className="stat-card">
                <p>Images Analyzed</p>
                <h2>{history.length}</h2>
              </div>

              <div className="stat-card">
                <p>AI Detections</p>
                <h2>{result ? predictions.length : "—"}</h2>
              </div>

              <div className="stat-card">
                <p>Model Status</p>
                <h2>
                  {loading
                    ? "Processing"
                    : result
                    ? "Connected"
                    : "Ready"}
                </h2>
              </div>
            </section>

            <section className="upload-card">
              <h2>Image Analysis</h2>
              <p>Upload a workplace image to begin.</p>

              <label className="upload-zone">
                {image ? (
                  <img
                    src={annotatedImage || image}
                    alt="Workplace safety analysis"
                  />
                ) : (
                  <>
                    <UploadCloud size={44} />
                    <strong>Click to upload an image</strong>
                    <span>JPG, PNG or WEBP (Max 10 MB)</span>
                  </>
                )}

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleUpload}
                  hidden
                />
              </label>

              <button
                onClick={analyzeImage}
                disabled={!selectedFile || loading}
              >
                {loading ? "Analyzing..." : "Analyze Image"}
              </button>

              {error && (
                <p className="vg-error">{error}</p>
              )}

              {result && (
                <div className="vg-results">
                  <h2>Analysis Results</h2>

                  <div className="vg-summary">
                    <div>
                      <CheckCircle2 size={22} />
                      <strong>{predictions.length}</strong>
                      <span>Total Detections</span>
                    </div>

                    <div>
                      <AlertTriangle size={22} />
                      <strong>{violations.length}</strong>
                      <span>Potential PPE Flags</span>
                    </div>
                  </div>

                  <h3>Detected Objects</h3>

                  {predictions.length === 0 ? (
                    <p>
                      No objects detected. This does not
                      confirm PPE compliance.
                    </p>
                  ) : (
                    <div className="vg-detection-list">
                      {predictions.map((item, index) => {
                        const flagged = [
                          "no-hardhat",
                          "no-safety-vest",
                        ].includes(
                          String(item.class || "").toLowerCase()
                        );

                        return (
                          <div
                            className="vg-detection"
                            key={index}
                          >
                            <span>
                              {flagged ? "⚠️" : "✓"}{" "}
                              {item.class || "Unknown"}
                            </span>

                            <strong>
                              {typeof item.confidence === "number"
                                ? `${(
                                    item.confidence * 100
                                  ).toFixed(1)}%`
                                : "N/A"}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="vg-disclaimer">
                    AI detections are preliminary.
                    Potential safety violations require
                    human review.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="upload-card">
            <h2>Recent Analyses</h2>

            {history.length === 0 ? (
              <p>No analysis history yet.</p>
            ) : (
              <div className="vg-history">
                {history.map((item) => (
                  <div className="vg-history-item" key={item.id}>
                    <img
                      src={item.annotatedImage || item.image}
                      alt={item.filename}
                    />

                    <div>
                      <h3>{item.filename}</h3>
                      <p>{item.date}</p>
                      <p>
                        {item.detections} detections ·{" "}
                        {item.violations} potential flags
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="vg-disclaimer">
              History is stored temporarily in this
              browser session and is cleared on refresh.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
