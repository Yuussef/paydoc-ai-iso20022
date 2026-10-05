import { useState } from "react";

export default function SearchPanel({ api }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${api}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 5 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Search request failed.");
      setResults(data.results || []);
    } catch (requestError) {
      setError(requestError.message || "Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="tool-page">
      <div className="tool-intro"><div className="eyebrow"><span className="eyebrow-line" /> SOURCE-BACKED LOOKUP</div><h1>Knowledge base</h1><p>Search local reference notes and follow the source links. This starter uses lightweight keyword matching; semantic retrieval comes later.</p></div>
      <form className="surface-card search-form" onSubmit={search}><label className="field-label" htmlFor="search-query">What are you looking for?</label><div className="search-input-row"><span aria-hidden="true">⌕</span><input id="search-query" value={query} onChange={(event) => { setQuery(event.target.value); setResults(null); setError(""); }} placeholder="Try: schema version, payment message, validation" minLength={2} maxLength={300} required /><button className="button-primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}<span aria-hidden="true">→</span></button></div><div className="search-hint"><span className="status-dot green" /> Results come from local notes and include provenance links.</div></form>
      <section className="search-results" aria-live="polite"><div className="results-heading"><div><div className="eyebrow">REFERENCE RESULTS</div><h2>{results ? `${results.length} results` : "Search the reference library"}</h2></div><span className="search-scope">LOCAL CORPUS</span></div>
        {error && <div className="field-note error-note">{error}</div>}
        {results && results.length === 0 && <div className="surface-card no-results"><strong>No matching sources</strong><p>Try different terms or add more permitted documents to the local knowledge directory.</p></div>}
        {results?.map((item) => <article className="surface-card source-result" key={item.source_id}><div className="source-result-top"><span className="source-type">REFERENCE NOTE</span><span className="source-score">Match score {item.score}</span></div><h3>{item.title}</h3><p className="source-excerpt">{item.excerpt}</p><div className="source-footer"><code>{item.source_id}</code>{item.message_id && <span>{item.message_id}</span>}{item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">Open source ↗</a>}</div></article>)}
        {results === null && <div className="surface-card no-results"><span className="empty-icon">⌕</span><strong>Documentation answers need sources</strong><p>Search returns excerpts with source IDs. The assistant will only be added after the retrieval results can be cited reliably.</p></div>}
      </section>
    </section>
  );
}
