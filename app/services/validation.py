from __future__ import annotations

from typing import Any

from app.services.registry import SchemaUnavailableError, schema_path

MAX_XML_CHARS = 1_000_000


class ValidatorUnavailableError(Exception):
    """Raised when the optional XML validation dependency is not installed."""


class SchemaConfigurationError(Exception):
    """Raised when a registered local XSD cannot be parsed or compiled."""


def validate_message(message_id: str, xml: str) -> dict[str, Any]:
    if len(xml) > MAX_XML_CHARS:
        raise ValueError(f"XML input exceeds the {MAX_XML_CHARS:,}-character limit.")
    selected_schema = schema_path(message_id)
    if selected_schema is None:
        raise SchemaUnavailableError(message_id)

    try:
        from lxml import etree
    except ImportError as exc:
        raise ValidatorUnavailableError from exc

    parser = etree.XMLParser(
        resolve_entities=False,
        no_network=True,
        load_dtd=False,
        huge_tree=False,
        recover=False,
    )
    try:
        xml_root = etree.fromstring(xml.encode("utf-8"), parser=parser)
    except etree.XMLSyntaxError as exc:
        return {
            "message_id": message_id,
            "valid": False,
            "kind": "malformed_xml",
            "errors": [
                {
                    "code": "XML_SYNTAX_ERROR",
                    "message": str(exc).split(", line")[0][:500],
                    "line": exc.lineno,
                    "column": None,
                    "xpath": None,
                }
            ],
            "errors_truncated": False,
        }

    try:
        schema_doc = etree.parse(str(selected_schema), parser=parser)
        schema = etree.XMLSchema(schema_doc)
    except (etree.XMLSyntaxError, etree.XMLSchemaParseError) as exc:
        raise SchemaConfigurationError from exc

    valid = schema.validate(xml_root)
    error_entries = list(schema.error_log)
    errors = [
        {
            "code": (entry.type_name or "XSD_VALIDATION_ERROR")[:100],
            "message": entry.message[:500],
            "line": entry.line or None,
            "column": entry.column or None,
            "xpath": entry.path,
        }
        for entry in error_entries[:100]
    ]
    return {
        "message_id": message_id,
        "valid": valid,
        "kind": "xsd_validation",
        "errors": errors,
        "errors_truncated": len(error_entries) > len(errors),
    }
