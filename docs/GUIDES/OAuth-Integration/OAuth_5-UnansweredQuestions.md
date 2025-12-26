# Unanswered Questions

## POS integration
- What POS system is the source of truth (name/vendor)?
- Is there a REST/GraphQL API, flat-file export, or webhook feed?
- What authentication method is available (API key, OAuth, VPN)?
- What is the canonical service record schema (fields, attachments, timestamps)?
- How are assets identified (serial, internal IDs) and how reliable is matching?

## BigCommerce
- Which store API scopes are available (customers, orders, carts, checkout)?
- Do we need SSO for customer login, or is standard BigCommerce login acceptable?
- Are webhooks enabled for order/customer updates and what signature scheme is required?
- Are there existing customer IDs to link to Supabase users (email match, external ID)?

## Roles and verification
- Confirm role taxonomy: `owner`, `support`, `admin`.
- What is the workflow for verifying ownership (serial claim + review, dealer validation, POS match)?
- Should support staff have read-only access to assistant history and service records?

## Data retention + privacy
- Desired retention period for assistant logs and per-user history.
- Are users allowed to delete their conversation history?
- What PII fields must be redacted from analytics logs?
