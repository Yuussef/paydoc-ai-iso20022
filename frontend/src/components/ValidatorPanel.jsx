import { useRef, useState } from "react";

export default function ValidatorPanel({ messages, configured, api }) {
  const [messageId, setMessageId] = useState("");
  const [xml, setXml] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInput = useRef(null);
  const available = messages.filter((message) => message.available);

  function updateMessageId(value) {
    setMessageId(value);
    setResult(null);
    setError("");
  }

  function updateXml(value) {
    setXml(value);
    setResult(null);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setResult(null);
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${api}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId, xml }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Validation request failed.");
      setResult(data);
    } catch (requestError) {
      setError(requestError.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }

  function loadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError("");
    if (file.size > 1_000_000) {
      setError("Choose an XML file smaller than 1 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setXml(String(reader.result || ""));
      setResult(null);
      setError("");
    };
    reader.onerror = () => setError("The selected file could not be read.");
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <section className="tool-page">
      <div className="tool-intro"><div className="eyebrow"><span className="eyebrow-line" /> DETERMINISTIC CHECK</div><h1>Validate XML</h1><p>Check a synthetic payment message against the exact local XSD version. No model is involved in deciding the result.</p></div>
      <div className="tool-layout">
        <form className="surface-card editor-card" onSubmit={submit}>
          <div className="card-heading"><div><div className="eyebrow">MESSAGE INPUT</div><h3>Validation request</h3></div><span className="local-tag"><span className="status-dot green" />LOCAL XSD</span></div>
          <label className="field-label" htmlFor="message-id">Message definition</label>
          {available.length ? <select id="message-id" value={messageId} onChange={(event) => updateMessageId(event.target.value)} required><option value="">Select a registered version</option>{available.map((item) => <option key={item.message_id} value={item.message_id}>{item.message_id} — {item.title}</option>)}</select> : <div className="field-note">No schemas are available. Register a locally approved XSD in <code>data/schemas/registry.json</code>.</div>}
          <div className="editor-toolbar"><label className="field-label" htmlFor="xml-input">XML document</label><button type="button" className="upload-button" onClick={() => fileInput.current?.click()}>↑ <span>Upload .xml</span></button><input ref={fileInput} className="visually-hidden" type="file" accept=".xml,text/xml,application/xml" onChange={loadFile} aria-label="Upload an XML file" /></div>
          <textarea id="xml-input" className="code-editor" value={xml} onChange={(event) => updateXml(event.target.value)} placeholder={'Paste synthetic ISO 20022 XML here…\n\nThe validator only runs when a matching local XSD is registered.'} spellCheck="false" required />
          <div className="editor-meta"><span>{xml.length.toLocaleString()} / 1,000,000 characters</span><span>External entities disabled</span></div>
          <button className="button-primary submit-button" type="submit" disabled={loading || !messageId || !xml.trim()}>{loading ? "Validating…" : "Run XSD validation"}<span aria-hidden="true">→</span></button>
          <p className="form-footnote">XSD validity does not prove compliance with a payment scheme or bank usage guideline.</p>
        </form>
        <aside className="result-column">
          <div className={`surface-card result-card ${result ? (result.valid ? "result-valid" : "result-invalid") : ""}`} aria-live="polite">
            <div className="eyebrow">VALIDATION RESULT</div>
            {!result && !error && <div className="result-empty"><div className="result-symbol">✓</div><h3>Ready when you are</h3><p>Choose a supported message version and provide XML. The result and diagnostics will appear here.</p></div>}
            {error && <div className="result-message"><span className="result-symbol error-symbol">!</span><h3>Validation unavailable</h3><p>{error}</p></div>}
            {result && <div className="result-message"><span className="result-symbol">{result.valid ? "✓" : "!"}</span><h3>{result.valid ? "Schema valid" : result.kind === "malformed_xml" ? "Malformed XML" : "Schema validation failed"}</h3><p><code>{result.message_id}</code> · {result.errors.length} {result.errors.length === 1 ? "diagnostic" : "diagnostics"}</p>{result.errors.map((item, index) => <div className="diagnostic" key={`${item.code}-${index}`}><strong>{item.code}</strong><p>{item.message}</p><small>{[item.line && `Line ${item.line}`, item.column && `Column ${item.column}`, item.xpath].filter(Boolean).join(" · ")}</small></div>)}</div>}
          </div>
          <div className="notice-card"><span className="notice-mark">i</span><div><strong>Version matters</strong><p>Validation uses only the schema registered for the selected message ID. The app never infers a version from XML.</p></div></div>
        </aside>
      </div>
    </section>
  );
}
