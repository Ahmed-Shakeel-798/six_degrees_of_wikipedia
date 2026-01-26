import { useState, useRef } from "react";

function App() {
  const [start, setStart] = useState("");
  const [target, setTarget] = useState("");
  const [jobId, setJobId] = useState(null);
  const [addingWorker, setAddingWorker] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setResult(null);
    setError(null);
    setLoading(true);
    setJobId(null);

    const source = new EventSource(
      `http://localhost:3000/api/search/stream?startArticle=${encodeURIComponent(start)}&targetArticle=${encodeURIComponent(target)}`
    );

    eventSourceRef.current = source;

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.jobId) {
        setJobId(data.jobId);
      }

      if (data.status === "progress") {
        setResult((prev) => ({
          ...(prev || {}),
          ...data,
        }));
      }

      if (data.status === "done") {
        setResult(data);
        setLoading(false);
        setJobId(null);
        setAddingWorker(false);
        source.close();
        eventSourceRef.current = null;
      }

      if (data.status === "error") {
        setError(data.message);
        setLoading(false);
        setJobId(null);
        setAddingWorker(false);
        source.close();
        eventSourceRef.current = null;
      }
    };
  }

  function cancelSearch() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setLoading(false);
    setJobId(null);
    setAddingWorker(false);

    setResult((prev) => ({
      ...prev,
      cancelled: true,
      timeTaken: prev?.timeTaken ? prev.timeTaken : undefined,
    }));
  }

  async function addWorker() {
    if (!jobId || addingWorker) return;

    setAddingWorker(true);

    try {
      const res = await fetch("http://localhost:3000/api/search/add-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();

      if (data.added) {
        setToast({
          type: "success",
          message: "New worker added successfully",
        });
      } else {
        setToast({
          type: "warning",
          message: data.message || "No available workers",
        });
      }
    } catch (err) {
      setToast({
        type: "error",
        message: "Failed to add worker",
      });
    } finally {
      setAddingWorker(false);
    }

    // auto-dismiss
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Shortest Path Between Two Wikipedia Articles</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            placeholder="Starting Article"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            style={styles.input}
          />
          <input
            placeholder="Target Article"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            style={styles.input}
          />

          <button style={styles.button} disabled={loading}>
            {loading ? "Searching..." : "Submit"}
          </button>

          {loading && (
            <div style={styles.actionRow}>
                <button
                  type="button"
                  onClick={cancelSearch}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>

              <button
                type="button"
                onClick={addWorker}
                disabled={!jobId || addingWorker}
                style={{
                  ...styles.workerButton,
                  opacity: jobId && !addingWorker ? 1 : 0.5,
                  cursor: jobId && !addingWorker ? "pointer" : "not-allowed",
                }}
              >
                {addingWorker ? "Adding..." : "Add worker"}
              </button>

            </div>
          )}
        </form>

        {loading && <p style={styles.muted}>⏳ Searching Wikipedia…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {(loading || result) && (
          <div style={styles.resultCard}>

            {/* PATH */}
            <div style={styles.path}>
              Shortest Path:
              {result?.path && result.path.length > 0 ? (
                result.path.map((node, index) => {
                  const [title, link] = Object.entries(node)[0];
                  return (
                    <span key={index} style={styles.pathItem}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                      >
                        {title}
                      </a>
                      {index < result.path.length - 1 && (
                        <span style={styles.arrow}>→</span>
                      )}
                    </span>
                  );
                })
              ) : result?.cancelled ? (
                <span style={styles.calculating}>Cancelled</span>
              ) : (
                <span style={styles.calculating}>Calculating…</span>
              )}
            </div>

            {/* TIME */}
            <p style={styles.steps}>
              Search Time:{" "}
              {result?.timeTaken?.formatted ? (
                <strong>{result.timeTaken.formatted}</strong>
              ) : (
                <span style={styles.calculating}>
                  {result?.cancelled ? "Cancelled" : "Calculating…"}
                </span>
              )}
            </p>

            {/* LINKS EXPANDED */}
            <p style={styles.steps}>
              Total Links Expanded:{" "}
              <strong>
                {result?.totalLinksExpanded ?? 0}
              </strong>
            </p>

            <p style={styles.steps}>
              Frontier Size:{" "}
              <strong>
                {result?.frontierSize ?? 0}
              </strong>
            </p>
          </div>
        )}

        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              padding: "12px 16px",
              borderRadius: "8px",
              background:
                toast.type === "success"
                  ? "#16a34a"
                  : toast.type === "warning"
                  ? "#ca8a04"
                  : "#dc2626",
              color: "#fff",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              zIndex: 1000,
            }}
          >
            {toast.message}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#1e1e1e",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    color: "#fff",
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "#2b2b2b",
    color: "#fff",
  },

  button: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    cursor: "pointer",
  },

  muted: {
    marginTop: "10px",
    color: "#aaa",
    textAlign: "center",
  },

  error: {
    marginTop: "10px",
    color: "#ff6b6b",
    textAlign: "center",
  },

  resultCard: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "8px",
    background: "#121212",
    border: "1px solid #333",
  },

  path: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
    marginTop: "10px",
  },

  pathItem: {
    display: "flex",
    alignItems: "center",
  },

  link: {
    color: "#60a5fa",
    textDecoration: "none",
    fontWeight: "500",
  },

  arrow: {
    margin: "0 6px",
    color: "#888",
  },

  steps: {
    marginTop: "12px",
    color: "#ccc",
  },

  calculating: {
    color: "#9ca3af",      // soft gray
    fontStyle: "italic",
    opacity: 0.75,
  },

  actionRow: {
    display: "flex",
    gap: "12px",
    width: "100%",
  },

  cancelButton: {
    flex: 1,                 
    padding: "12px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #555",
    background: "#1f2937",
    color: "#e5e7eb",
    cursor: "pointer",
  },

  workerButton: {
    flex: 1,               
    padding: "12px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #2563eb",
    background: "#1e40af",
    color: "#fff",
  },
};

export default App;
