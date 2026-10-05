# PayDoc AI

**A local-first ISO 20022 developer workbench built with FastAPI and React.** It validates XML against an explicitly selected local XSD, searches a small local reference corpus, and exposes the same operations as MCP tools. An optional AWS Bedrock client can call those MCP tools before answering.

> This is a portfolio project, not a payment processor, compliance product, or banking system. Use synthetic XML only.

## Current status

| Capability | Status |
| --- | --- |
| FastAPI health and schema-registry endpoints | Implemented |
| Secure XML parsing and local XSD validation | Implemented; requires you to install a permitted XSD locally |
| Local source manifest and keyword search with provenance links | Implemented; starter corpus contains one original project note |
| React dashboard, validator form, XML file upload, search UI | Implemented |
| MCP server exposing shared domain operations over stdio | Implemented; install the optional `ai` dependencies |
| Bedrock Converse client invoking MCP tools and returning sources | Implemented; requires AWS credentials and a configured model with tool use |
| Starter evaluation cases | Included in `data/evaluations/starter.jsonl`; runner and measured metrics are next |

The registry starts empty on purpose. The app never downloads a schema, invents a validation outcome, or assumes an ISO 20022 version. The starter search is lexical keyword matching, not embeddings or semantic RAG. The optional AI path is disabled until configured and needs the `ai` dependency extra.

## Why this project

Payment developers need to inspect message structure, understand validation errors, and find the documentation that applies to a particular message version. PayDoc AI demonstrates how a senior software engineer can combine backend engineering, payment-domain experience, MCP, and grounded AI while keeping validation deterministic.

## Features

- **Version-explicit validation:** choose a registered message ID such as `pacs.008.001.08`; the server validates against its local XSD.
- **Structured diagnostics:** return schema/parser error code, message, line, column, and XPath when available.
- **Safe XML parsing:** disable network access, entity resolution, and DTD loading; cap XML input length.
- **Source-backed lookup:** search local Markdown references and return a source ID, excerpt, and provenance link.
- **MCP tools:** list versions, validate a message, search local documents, and look up evidence related to an error.
- **Optional AI assistant:** Bedrock receives tool definitions through the MCP SDK and surfaces returned sources; it does not decide whether XML passes the XSD.
- **React + FastAPI:** a responsive dashboard, validator, knowledge search, and assistant call the real API.

XSD validation only checks the constraints represented by the chosen schema. It does not prove compliance with scheme-specific, community, or bank usage guidelines. ISO 20022 itself notes that implementation requirements depend on the community using a message. See the [official FAQ](https://www.iso20022.org/faq).

## Architecture

```text
React + Vite browser app
  ├── GET  /api/v1/health
  ├── GET  /api/v1/messages
  ├── POST /api/v1/validate ──> local, versioned XSD
  ├── POST /api/v1/search   ──> local sources + provenance
  └── POST /api/v1/ask      ──> Bedrock Converse ──> MCP client ──> MCP tools

Independent MCP stdio server ──> same Python domain services <── in-memory MCP client + Bedrock Converse
```

The MCP server and HTTP API call the same validation/search service functions in `app/services/`. The Bedrock adapter uses an in-memory MCP client; the server can also run independently over stdio for an MCP host.

## Requirements

- Python 3.11 or later
- [uv](https://docs.astral.sh/uv/)
- Node.js 22 or later and npm
- Git
- One local ISO 20022 XSD for the validation workflow (manual setup below)
- Optional: AWS Bedrock access and credentials for the AI assistant

## Run locally

### 1. Start the API

From the repository root:

```bash
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API is at `http://127.0.0.1:8000`; interactive OpenAPI docs are at `http://127.0.0.1:8000/docs`.

To enable the model-backed assistant, install the optional dependencies and configure a Bedrock model that supports Converse tool use:

```bash
uv sync --extra ai
```

Set `BEDROCK_MODEL_ID` and `AWS_REGION` in your local `.env` or shell. The app uses the AWS SDK credential provider chain; follow your approved AWS login flow. Do not include confidential or customer data in assistant prompts.

### 2. Start the React app

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). The Vite development server proxies `/api` to the FastAPI server on port 8000. `npm install` creates `frontend/package-lock.json`; commit that lockfile so installs are reproducible.

### Windows PowerShell

The same commands work in PowerShell. If you need a local environment file, copy the template with `Copy-Item .env.example .env`. Never add `.env` or credentials to Git.

## Deploy a free demo

The project includes a Render Blueprint for a single FastAPI web service that also serves the built React app. To deploy it, open the [Render Blueprint creation page](https://dashboard.render.com/blueprint/new?repo=https://github.com/Yuussef/paydoc-ai-iso20022), connect the public GitHub repository, and create the Blueprint. Render builds the frontend and API from `render.yaml` and assigns an `onrender.com` URL.

The free web service can spin down after 15 minutes without requests, so the first visit after inactivity may take a little longer. This is a portfolio demo: do not submit real payment messages, customer information, or confidential documents. No ISO XSD or AWS credentials are included; validation needs a schema you are permitted to use, and the AI assistant stays disabled until configured.

## Add a permitted local ISO 20022 schema

1. Visit the [official ISO 20022 Message Definitions catalogue](https://www.iso20022.org/iso-20022-message-definitions) and filter to the Payments domain.
2. Select one message definition and record its **complete identifier and version**. Start with one `pacs.008` version only; do not mix versions in a registry entry.
3. From the relevant message set, obtain the XSD and the smallest useful official reference document. ISO notes that message-set documentation (such as MDRs/MUGs) is provided at message-set level, while each message definition has its own schema.
4. Review the terms for the files. Put the XSD in `data/schemas/` for local use. `.gitignore` excludes `*.xsd` by default; do not force-add downloaded files unless their terms permit redistribution.
5. Edit `data/schemas/registry.json` with the **actual** identifier and filename from the catalogue:

   ```json
   {
     "pacs.008.001.08": {
       "title": "FinancialInstitutionToFinancialInstitutionCustomerCreditTransferV08",
       "file": "pacs.008.001.08.xsd"
     }
   }
   ```

   These values show the registry shape only. Confirm that the selected official version and downloaded filename really match; update both if they do not.

6. Restart neither API nor UI: the API reads the registry on each request. Refresh the dashboard; the version appears when its local XSD is present.
7. Use synthetic XML for validation. A missing/unregistered XSD returns HTTP `409` with setup guidance; malformed XML returns a deterministic invalid result; XSD failures return diagnostics.

If the local schema package uses XSD imports/includes, keep the required companion schemas beside it and verify that the selected XSD resolves them from the local directory. Do not point the registry to an arbitrary user-uploaded path.

## API examples

Health:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

List registered versions and whether their local XSD is present:

```bash
curl http://127.0.0.1:8000/api/v1/messages
```

Validate a synthetic XML message. This abbreviated sample illustrates the request shape; its expected XSD result depends on the exact schema version you install:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/validate \
  -H "Content-Type: application/json" \
  --data-binary @examples/validate-request.json
```

Search the starter corpus:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/search \
  -H "Content-Type: application/json" \
  --data-binary @examples/search-request.json
```

Validation request JSON is in [`examples/validate-request.json`](examples/validate-request.json), and a search request is in [`examples/search-request.json`](examples/search-request.json). Search scores are simple matched-keyword counts; they are not confidence scores.

Ask the optional assistant and launch the independent MCP server:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"How should I interpret this validation error?"}'

uv run --extra ai python -m app.mcp_server.server
uv run --extra ai mcp dev app/mcp_server/server.py
```

In PowerShell, use `curl.exe` (not the `curl` alias) and keep the request on one line. The MCP Inspector also needs Node.js and `npx` on `PATH`.

In PowerShell, use `curl.exe` (not the `curl` alias) and keep each request on one line, for example: `curl.exe -X POST http://127.0.0.1:8000/api/v1/search -H "Content-Type: application/json" --data-binary "@examples/search-request.json"`.

## Detailed roadmap: MCP + grounded LLM

### Step 1 — Load a small, traceable corpus

- Use one official `pacs.008` XSD version and one or two permitted reference documents.
- Keep the complete message ID/version with all schema, document, and retrieval metadata.
- Expand `data/knowledge/sources.json` with a stable ID, document title, version/message ID (when specific), official URL, local filename, and retrieval date.
- Preserve headings and page/section references during extraction so citations can identify where a passage came from.
- Keep restricted source files out of Git unless redistribution is allowed. Commit the manifest, original project notes, ingestion code, and instructions instead.
- Add more message versions only after version-filtered retrieval and validation work correctly.

### Step 2 — Extract reusable deterministic services

- XSD validation, registry loading, and document lookup live in `app/services/` and are shared by HTTP and MCP adapters.
- Add richer ingestion/search (section and page retention, chunking, and eventually embedding-based retrieval) without changing the service contract.
- Return stable machine-readable errors for malformed XML, unknown message versions, unavailable schemas, and XSD failures.
- Keep schema selection allowlisted; disable external entity/network resolution and apply request/result limits.

### Step 3 — Expose the services through MCP

The server uses the [official MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk), is an optional `ai` dependency extra, and defaults to local stdio transport. The server and Bedrock client are implemented; Inspector verification and automated in-memory client evaluation remain to be added.

Initial tools:

| Tool | Inputs | Result |
| --- | --- | --- |
| `list_supported_messages` | none | Registered message IDs/versions and local schema availability |
| `validate_message` | `message_id`, `xml` | Deterministic validity and structured diagnostics |
| `search_iso_documents` | `query`, optional `message_id`, `limit` | Excerpts with source ID, version, section/page, and provenance |
| `explain_validation_error` | `message_id`, error details | Matching source excerpts; no invented rule when no source matches |

The tools return structured results. The MCP server provides tools; it does not call the model itself. The Bedrock client supplies the model's tool calls to the MCP client and passes results back through Converse.

### Step 4 — Connect the optional LLM client

- The React assistant calls FastAPI `/api/v1/ask`; `app/llm/bedrock.py` uses the official in-memory MCP client and AWS Bedrock Converse tool use.
- Keep provider-specific orchestration isolated; add another adapter only when needed.
- Let the client discover tools, send the user's question and tool definitions to the model, validate model tool arguments, execute requested MCP calls, and return tool results for a final explanation.
- Require the answer to cite only source IDs actually returned by search. If retrieval has no relevant evidence, say so.
- Display deterministic validation status/errors separately from generated explanation.
- Keep this feature optional: core validation/search must work without model credentials.
- Store credentials only in the normal AWS credential chain or ignored environment configuration. Never commit keys, prompts containing sensitive data, or customer XML.

### Step 5 — Expand samples and evaluate behavior

- Add synthetic valid and invalid XML fixtures for the exact selected XSD version: malformed XML, missing required content, invalid code/value, and unsupported version.
- Derive each expected validation outcome by running the deterministic validator against the local schema; do not guess expected results.
- A starter JSONL set is in `data/evaluations/starter.jsonl`; expand it with cases for the selected schema, expected source IDs, and criteria for a correct answer. Keep copyrighted excerpts out unless their terms permit it.
- Track validation expected-result accuracy, retrieval hit@k/recall@k, version-filter correctness, citation correctness, and manually reviewed grounded-answer quality.
- Measure latency and model/token cost for the LLM path only if it is implemented.
- Publish measured results with the dataset size and limitations. Do not state targets or performance numbers before running the evaluation.

## Example expected behavior

### Deterministic validation

Input: synthetic XML and an explicitly registered message version.

Expected: a JSON result containing that message ID, `valid: true|false`, a result kind, and structured diagnostics. A parser error, unsupported version, unavailable XSD, and schema error are distinct conditions. The exact XSD diagnostics depend on the downloaded version and parser.

### Grounded assistant

Question: “Why did this synthetic `pacs.008` message fail validation?”

Expected flow: call `validate_message` → search for the relevant field/rule → explain the validator's result → cite returned source IDs → clearly state that XSD validity does not prove scheme or bank compliance. If no source supports the explanation, say it cannot be confirmed from the loaded corpus.

## Data handling and limits

- Use synthetic sample messages only. Do not use production payment traffic or internal employer documentation.
- Keep downloaded XSDs/documents local unless redistribution terms explicitly permit committing them.
- Do not commit `.env`, API keys, AWS credentials, or private source documents.
- Treat retrieved document text and XML as untrusted data, never as instructions for the model.
- XSD validity is not scheme-level or institution-level compliance.
- The current search is basic token overlap over local Markdown; it is not semantic RAG and should not be described as such.

## Publish to GitHub

This project is published at [github.com/Yuussef/paydoc-ai-iso20022](https://github.com/Yuussef/paydoc-ai-iso20022). Clone it with:

```bash
git clone https://github.com/Yuussef/paydoc-ai-iso20022.git
cd paydoc-ai-iso20022
```

To publish later changes, commit them on `main` and run `git push`. Do not force-add local XSDs or `.env` files; `.gitignore` excludes them by default. The frontend does not yet include an npm lockfile; generate and commit `frontend/package-lock.json` after reviewing the dependency versions if reproducible npm installs are required.

## References

- [ISO 20022 Message Definitions catalogue](https://www.iso20022.org/iso-20022-message-definitions)
- [ISO 20022 Catalogue of Messages](https://www.iso20022.org/catalogue-messages)
- [ISO 20022 FAQ](https://www.iso20022.org/faq)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Official MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)

## License and source-data note

Choose a license for the original project code when ready. A project code license does not automatically grant redistribution rights to ISO schemas, message reports, or other third-party materials. Keep source files, provenance, and their terms clearly documented and separate from original code.
