from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parents[2]
SCHEMA_DIR = Path(os.getenv("PAYDOC_SCHEMA_DIR", ROOT / "data" / "schemas")).resolve()
SCHEMA_MANIFEST = SCHEMA_DIR / "registry.json"
MESSAGE_ID_PATTERN = re.compile(r"^[a-z0-9]{4}\.\d{3}\.\d{3}\.\d{2,3}$")


class SchemaUnavailableError(Exception):
    """Raised when a message version has no registered local XSD."""


def _load_registry() -> dict[str, Any]:
    try:
        raw = json.loads(SCHEMA_MANIFEST.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    return raw if isinstance(raw, dict) else {}


def schema_path(message_id: str) -> Path | None:
    if not MESSAGE_ID_PATTERN.fullmatch(message_id):
        return None
    entry = _load_registry().get(message_id)
    if not isinstance(entry, dict) or not isinstance(entry.get("file"), str):
        return None
    candidate = (SCHEMA_DIR / entry["file"]).resolve()
    if candidate.parent != SCHEMA_DIR or candidate.suffix.lower() != ".xsd":
        return None
    return candidate if candidate.is_file() else None


def supported_messages() -> dict[str, Any]:
    messages = []
    for message_id, metadata in sorted(_load_registry().items()):
        if not isinstance(metadata, dict) or not MESSAGE_ID_PATTERN.fullmatch(message_id):
            continue
        title = metadata.get("title")
        if not isinstance(title, str):
            title = message_id
        messages.append(
            {
                "message_id": message_id,
                "title": title[:160],
                "available": schema_path(message_id) is not None,
            }
        )
    return {"messages": messages, "configured": any(item["available"] for item in messages)}
