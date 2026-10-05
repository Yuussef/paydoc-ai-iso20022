# Local schema setup

Obtain a message schema from the [official ISO 20022 Message Definitions catalogue](https://www.iso20022.org/iso-20022-message-definitions). Select a payment message definition and note its **full versioned identifier**. Review the source terms before storing or redistributing any downloaded file.

For local development, place the XSD in this directory (or set `PAYDOC_SCHEMA_DIR` to another directory) and add an entry to `registry.json`:

```json
{
  "pacs.008.001.08": {
    "title": "FinancialInstitutionToFinancialInstitutionCustomerCreditTransferV08",
    "file": "pacs.008.001.08.xsd"
  }
}
```

The identifier and filename above illustrate the registry format; verify that the selected official catalogue entry actually uses this version and filename. Keep downloaded XSDs out of Git unless their terms permit redistribution. This application validates only the selected XSD and does not evaluate scheme-specific usage guidelines.
