export default function Dashboard({ health, messages, configured, onNavigate }) {
  const availableCount = messages.filter((item) => item.available).length;
  return (
    <>
      <section className="hero-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> PAYMENT ENGINEERING TOOLKIT</div>
          <h1>Understand every<br /><span>payment message.</span></h1>
          <p className="hero-copy">Validate ISO 20022 XML against a versioned schema, then find the documentation behind the result. Use synthetic data only.</p>
          <div className="hero-actions">
            <button className="button-primary" onClick={() => onNavigate("validate")}>Validate a message <span aria-hidden="true">→</span></button>
            <button className="button-secondary" onClick={() => onNavigate("knowledge")}>Search documentation</button>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="art-center"><span>ISO</span><strong>20022</strong></div>
          <span className="art-chip chip-top">pacs.008</span><span className="art-chip chip-bottom">XML · XSD</span>
          <span className="art-node node-one" /><span className="art-node node-two" />
        </div>
      </section>

      {!configured && (
        <section className="setup-banner" aria-label="Schema setup notice">
          <span className="banner-icon" aria-hidden="true">i</span>
          <div><strong>No ISO schemas are configured yet</strong><p>Add an approved XSD and register its exact message version to enable validation. The app will not guess or download schemas for you.</p></div>
          <button className="text-button" onClick={() => onNavigate("validate")}>Setup details <span aria-hidden="true">→</span></button>
        </section>
      )}

      <section className="section-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>At a glance</h2></div><span className="live-label"><span className={`status-dot ${health === "online" ? "green" : "muted"}`} />{health === "online" ? "All systems ready" : "Connecting to API"}</span></section>
      <section className="stat-grid" aria-label="Workspace status">
        <article className="stat-card"><div className="stat-top"><span className="stat-icon purple">⌘</span><span className="stat-caption">SCHEMA REGISTRY</span></div><strong className="stat-number">{availableCount.toString().padStart(2, "0")}</strong><span className="stat-detail">{availableCount === 1 ? "message version" : "message versions"} available locally</span></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-icon blue">⌕</span><span className="stat-caption">DOCUMENT SEARCH</span></div><strong className="stat-number">01</strong><span className="stat-detail">Starter source note indexed</span></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-icon mint">✳</span><span className="stat-caption">AI ASSISTANT</span></div><strong className="stat-number stat-word">Bedrock-ready</strong><span className="stat-detail">Configure a model to enable MCP tools</span></article>
      </section>

      <section className="bottom-grid">
        <article className="surface-card focus-card"><div className="card-heading"><div><div className="eyebrow">START HERE</div><h3>One clear workflow</h3></div><span className="step-count">01 — 03</span></div>
          <div className="workflow-list">
            <div className="workflow-item"><span className="workflow-number done">1</span><div><strong>Choose a message version</strong><p>Validation is tied to a specific local XSD.</p></div><span className="workflow-state">SETUP</span></div>
            <div className="workflow-item"><span className="workflow-number">2</span><div><strong>Validate synthetic XML</strong><p>Receive structured XSD diagnostics.</p></div><span className="workflow-state">READY</span></div>
            <div className="workflow-item"><span className="workflow-number">3</span><div><strong>Look up supporting docs</strong><p>Search indexed notes with source links.</p></div><span className="workflow-state">READY</span></div>
          </div>
        </article>
        <article className="surface-card registry-card"><div className="card-heading"><div><div className="eyebrow">LOCAL SOURCES</div><h3>Message registry</h3></div><span className="registry-count">{messages.length.toString().padStart(2, "0")}</span></div>
          {messages.length ? <div className="registry-list">{messages.map((message) => <div className="registry-row" key={message.message_id}><span className="schema-icon">XML</span><div><strong>{message.message_id}</strong><small>{message.title}</small></div><span className={`registry-status ${message.available ? "ready" : "missing"}`}>{message.available ? "READY" : "XSD MISSING"}</span></div>)}</div> : <div className="empty-registry"><span className="empty-icon">⌁</span><strong>Nothing registered yet</strong><p>When you add a local schema, its exact version will appear here.</p><button className="text-button" onClick={() => onNavigate("validate")}>Configure a schema →</button></div>}
        </article>
      </section>
    </>
  );
}
