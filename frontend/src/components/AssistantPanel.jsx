import { useState } from "react";

export default function AssistantPanel({ api }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(event) {
    event.preventDefault();
    setResponse(null);
    setError("");
    setLoading(true);
    try {
      const result = await fetch(`${api}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.detail || "The assistant could not answer.");
      setResponse(data);
    } catch (requestError) {
      setError(requestError.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="tool-page">
      <div className="tool-intro"><div className="eyebrow"><span className="eyebrow-line" /> MCP TOOL CLIENT</div><h1>Ask PayDoc AI</h1><p>The model can call the local message registry, validator, and document search over MCP before answering.</p></div>
      <div className="assistant-layout">
        <form className="surface-card assistant-form" onSubmit={ask}>
          <div className="card-heading"><div><div className="eyebrow">BEDROCK CONVERSE</div><h3>Ask about a payment message</h3></div><span className="local-tag"><span className="status-dot green" />TOOLS VIA MCP</span></div>
          <label className="field-label" htmlFor="assistant-question">Your question</label>
          <textarea id="assistant-question" className="question-editor" value={question} onChange={(event) => { setQuestion(event.target.value); setResponse(null); setError(""); }} maxLength={500} minLength={3} placeholder="Example: What does this validation error mean, and which source supports the explanation?" required />
          <div className="editor-meta"><span>{question.length} / 500 characters</span><span>No XML is sent unless included in your question</span></div>
          <button className="button-primary submit-button" type="submit" disabled={loading || question.trim().length < 3}>{loading ? "Asking…" : "Ask with MCP tools"}<span aria-hidden="true">→</span></button>
          <p className="form-footnote">This sends your question to the configured AWS Bedrock model. Do not include confidential or customer data.</p>
        </form>
        <div className="surface-card assistant-response" aria-live="polite">
          <div className="eyebrow">GROUNDED RESPONSE</div>
          {!response && !error && <div className="result-empty"><div className="result-symbol">✳</div><h3>Waiting for a question</h3><p>The assistant will use MCP tools where needed and attach the sources returned by local search.</p></div>}
          {error && <div className="result-message"><span className="result-symbol error-symbol">!</span><h3>Assistant unavailable</h3><p>{error}</p></div>}
          {response && <div className="assistant-answer"><p>{response.answer}</p><span className="model-caption">MODEL · {response.model_id}</span></div>}
        </div>
      </div>
      {response && <section className="assistant-sources"><div className="results-heading"><div><div className="eyebrow">MCP SEARCH RESULTS</div><h2>{response.sources?.length || 0} cited sources returned</h2></div></div>{response.sources?.length ? response.sources.map((source) => <article className="surface-card source-result" key={source.source_id}><div className="source-result-top"><span className="source-type">{source.source_id}</span>{source.message_id && <span className="source-score">{source.message_id}</span>}</div><h3>{source.title}</h3><p className="source-excerpt">{source.excerpt}</p>{source.source_url && <div className="source-footer"><a href={source.source_url} target="_blank" rel="noreferrer">Open source ↗</a></div>}</article>) : <div className="field-note">No local source was returned. Treat the assistant answer as unsupported by this knowledge base.</div>}</section>}
    </section>
  );
}
