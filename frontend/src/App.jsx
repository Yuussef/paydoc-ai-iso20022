import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import ValidatorPanel from "./components/ValidatorPanel.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import AssistantPanel from "./components/AssistantPanel.jsx";

const API = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const NAVIGATION = [
  { id: "overview", label: "Overview", glyph: "◫" },
  { id: "validate", label: "Validate XML", glyph: "⌘" },
  { id: "knowledge", label: "Knowledge base", glyph: "⌕" },
  { id: "assistant", label: "AI assistant", glyph: "✳" },
];

export default function App() {
  const [page, setPage] = useState("overview");
  const [health, setHealth] = useState("checking");
  const [messages, setMessages] = useState([]);
  const [messageSetup, setMessageSetup] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`${API}/health`).then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      }),
      fetch(`${API}/messages`).then((response) => {
        if (!response.ok) throw new Error("Could not load message registry");
        return response.json();
      }),
    ])
      .then(([status, registry]) => {
        if (!active) return;
        setHealth(status.status === "ok" ? "online" : "offline");
        setMessages(registry.messages || []);
        setMessageSetup(Boolean(registry.configured));
      })
      .catch(() => {
        if (active) setHealth("offline");
      });
    return () => {
      active = false;
    };
  }, []);

  const currentPage = NAVIGATION.find((item) => item.id === page);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setPage("overview")}>
          <span className="brand-mark" aria-hidden="true">P</span>
          <span><strong>PayDoc</strong><small>AI WORKBENCH</small></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          {NAVIGATION.map((item) => (
            <button
              className={`nav-item ${page === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setPage(item.id)}
              aria-current={page === item.id ? "page" : undefined}
            >
              <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="local-dot" />
            <div><strong>Local-first</strong><small>Your files stay on this machine</small></div>
          </div>
          <span className="version-label">PORTFOLIO BUILD · 0.1.0</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>PayDoc AI</span><span className="crumb-separator">/</span><strong>{currentPage?.label}</strong></div>
          <div className={`api-status ${health}`}><span className="status-dot" /> API {health}</div>
        </header>
        <div className="page-content">
          {page === "overview" && <Dashboard health={health} messages={messages} configured={messageSetup} onNavigate={setPage} />}
          {page === "validate" && <ValidatorPanel messages={messages} configured={messageSetup} api={API} />}
          {page === "knowledge" && <SearchPanel api={API} />}
          {page === "assistant" && <AssistantPanel api={API} />}
        </div>
        <footer className="page-footer">
          <span>PayDoc AI is a developer demo. It does not determine payment compliance.</span>
          <span>ISO 20022 · Version-aware by design</span>
        </footer>
      </main>
    </div>
  );
}
