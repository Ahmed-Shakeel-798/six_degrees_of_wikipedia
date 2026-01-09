import { useState } from "react";

function App() {
  const [start, setStart] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:3000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startArticle: start,
          targetArticle: target,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        </form>

        {loading && <p style={styles.muted}>⏳ Searching Wikipedia…</p>}
        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <div style={styles.resultCard}>
            <h3>Path Found</h3>

            <div style={styles.path}>
              {result.path.map((node, index) => {
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
              })}
            </div>

            <p style={styles.steps}>
              Steps: <strong>{result.steps}</strong>
            </p>

            <p style={styles.steps}>
              Search Time: <strong>{result.timeTaken.formatted}</strong>
            </p>

            <p style={styles.steps}>
              Total Links Expanded: <strong>{result.totalLinksExpanded}</strong>
            </p>
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
};

export default App;
