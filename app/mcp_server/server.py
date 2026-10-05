from __future__ import annotations

from typing import Any

from mcp.server.mcpserver import MCPServer

from app.services.knowledge_search import search_documents
from app.services.registry import SchemaUnavailableError, supported_messages
from app.services.validation import (
    SchemaConfigurationError,
    ValidatorUnavailableError,
    validate_message as validate_xml_message,
)

mcp = MCPServer(name="PayDoc AI ISO 20022", version="0.1.0")


@mcp.tool()
def list_supported_messages() -> dict[str, Any]:
    """List the ISO 20022 message versions registered in the local schema registry."""
    return supported_messages()


@mcp.tool()
def validate_message(message_id: str, xml: str) -> dict[str, Any]:
    """Validate XML deterministically against one explicitly selected local ISO 20022 XSD."""
    try:
        return validate_xml_message(message_id, xml)
    except SchemaUnavailableError:
        return {
            "message_id": message_id,
            "valid": False,
            "kind": "schema_unavailable",
            "errors": [],
            "detail": "No local XSD is registered for this exact message version.",
        }
    except ValidatorUnavailableError:
        return {"message_id": message_id, "valid": False, "kind": "validator_unavailable", "errors": []}
    except SchemaConfigurationError:
        return {"message_id": message_id, "valid": False, "kind": "schema_configuration_error", "errors": []}
    except ValueError as exc:
        return {"message_id": message_id, "valid": False, "kind": "invalid_input", "errors": [], "detail": str(exc)}


@mcp.tool()
def search_iso_documents(query: str, message_id: str | None = None, limit: int = 5) -> dict[str, Any]:
    """Search local ISO 20022 reference notes; results include stable source IDs and provenance links."""
    bounded_limit = max(1, min(limit, 10))
    return search_documents(query[:300], message_id, bounded_limit)


@mcp.tool()
def explain_validation_error(message_id: str, error_code: str) -> dict[str, Any]:
    """Find local documentation relevant to a validation error; do not infer missing rules."""
    return search_documents(f"{message_id} {error_code}"[:300], message_id, 5)


if __name__ == "__main__":
    mcp.run()
