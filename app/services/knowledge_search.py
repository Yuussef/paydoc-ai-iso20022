from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE_DIR = ROOT / "data" / "knowledge"
SOURCE_MANIFEST = KNOWLEDGE_DIR / "sources.json"
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "in", "is", "it", "of", "on", "or", "the", "this", "to", "what", "when",
    "where", "which", "with",
}


def _sources() -> list[dict[str, Any]]:
    try:
        raw = json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []
    return raw if isinstance(raw, list) else []


def _tokens(value: str) -> set[str]:
    return {
        token for token in re.findall(r"[a-zA-Z0-9]+", value.casefold())
        if len(token) > 1 and token not in STOP_WORDS
    }


def search_documents(query: str, message_id: str | None = None, limit: int = 5) -> dict[str, Any]:
    terms = _tokens(query)
    results = []
    for source in _sources():
        if not isinstance(source, dict):
            continue
        if message_id and source.get("message_id") not in (None, message_id):
            continue
        relative_file = source.get("file")
        if not isinstance(relative_file, str):
            continue
        document_path = (KNOWLEDGE_DIR / relative_file).resolve()
        if KNOWLEDGE_DIR.resolve() not in document_path.parents or not document_path.is_file():
            continue
        try:
            text = document_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        ranked_paragraphs = []
        for paragraph in text.split("\n\n"):
            clean_paragraph = " ".join(paragraph.split())
            paragraph_terms = _tokens(clean_paragraph)
            score = len(terms & paragraph_terms)
            if score:
                ranked_paragraphs.append((score, clean_paragraph))
        if not ranked_paragraphs:
            continue
        ranked_paragraphs.sort(key=lambda item: (-item[0], len(item[1])))
        score, excerpt = ranked_paragraphs[0]

        source_url = source.get("url")
        if not isinstance(source_url, str) or urlparse(source_url).scheme not in {"https", "http"}:
            source_url = None
        source_id = source.get("id")
        title = source.get("title")
        result_message_id = source.get("message_id")
        results.append(
            {
                "source_id": source_id if isinstance(source_id, str) else relative_file,
                "title": title[:160] if isinstance(title, str) else relative_file,
                "message_id": result_message_id if isinstance(result_message_id, str) else None,
                "source_url": source_url,
                "score": score,
                "excerpt": excerpt[:500],
            }
        )
    results.sort(key=lambda result: (-result["score"], result["source_id"]))
    return {"query": query, "results": results[:limit]}
