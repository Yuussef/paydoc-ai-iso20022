from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.staticfiles import StaticFiles

from app.services.knowledge_search import search_documents
from app.services.registry import SchemaUnavailableError, supported_messages
from app.services.validation import (
    MAX_XML_CHARS,
    SchemaConfigurationError,
    ValidatorUnavailableError,
    validate_message as validate_xml_message,
)

app = FastAPI(
    title="PayDoc AI API",
    description="Deterministic ISO 20022 schema validation and source-backed lookup.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ValidationRequest(BaseModel):
    message_id: str = Field(pattern=r"^[a-z0-9]{4}\.\d{3}\.\d{3}\.\d{2,3}$")
    xml: str = Field(min_length=1, max_length=MAX_XML_CHARS)


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=300)
    message_id: str | None = Field(default=None, pattern=r"^[a-z0-9]{4}\.\d{3}\.\d{3}\.\d{2,3}$")
    limit: int = Field(default=5, ge=1, le=10)


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "paydoc-ai"}


@app.get("/api/v1/messages")
def list_messages() -> dict[str, Any]:
    return supported_messages()


@app.post("/api/v1/validate")
def validate(payload: ValidationRequest) -> dict[str, Any]:
    try:
        return validate_xml_message(payload.message_id, payload.xml)
    except SchemaUnavailableError as exc:
        raise HTTPException(
            status_code=409,
            detail=(
                f"No local XSD is configured for {exc}. Add an approved schema file "
                "and register it in data/schemas/registry.json."
            ),
        ) from exc
    except ValidatorUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Install the lxml dependency to validate XSD.") from exc
    except SchemaConfigurationError as exc:
        raise HTTPException(status_code=500, detail="The configured local XSD could not be loaded.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc


@app.post("/api/v1/search")
def search(payload: SearchRequest) -> dict[str, Any]:
    return search_documents(payload.query, payload.message_id, payload.limit)


@app.post("/api/v1/ask")
async def ask(payload: AskRequest) -> dict[str, Any]:
    if not os.getenv("BEDROCK_MODEL_ID", "").strip():
        raise HTTPException(
            status_code=503,
            detail="Configure BEDROCK_MODEL_ID and AWS credentials to enable the AI assistant.",
        )
    try:
        from app.llm.bedrock import answer_with_mcp_tools

        return await answer_with_mcp_tools(payload.question)
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="Install the optional AI dependencies with `uv sync --extra ai`.",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail="The configured AI model could not complete the request.") from exc


FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
