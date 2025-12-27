# Unanswered Questions

## POS integration

**NOTE:** *Perazzi currently has not made a decision on which POS System to use*

- What POS system is the source of truth (name/vendor)?
- Is there a REST/GraphQL API, flat-file export, or webhook feed?
- What authentication method is available (API key, OAuth, VPN)?
- What is the canonical service record schema (fields, attachments, timestamps)?
- How are assets identified (serial, internal IDs) and how reliable is matching?

---

## BigCommerce

**NOTE:** *Currently the Perazzi BigCommerce store is created, but I have not been able to get access to it yet*

- Which store API scopes are available (customers, orders, carts, checkout)?
- Do we need SSO for customer login, or is standard BigCommerce login acceptable?
- Are webhooks enabled for order/customer updates and what signature scheme is required?
- Are there existing customer IDs to link to Supabase users (email match, external ID)?

---

## Roles and verification

**NOTE:** *I would say there needs to be 4 unique roles:*
  * *`prospect`: User who does not own a Perazzi and cannot connect to a serial number*
  * *`owner`: User who has a Perazzi and can verify ownership*
  * *`manager`: Perazzi "higher-up" that actually is a full admin but just not technologically capable enough to be full admin, so I would gatekeep some priveledges from them just to make sure they don't accidentally "press a button they weren't supposed to"*
  * *`admin`: Full access*

- Confirm role taxonomy: `prospect`, `owner`, `manager`, `admin`.
- What is the workflow for verifying ownership (serial claim + review, dealer validation, POS match)?

---

## Data retention + privacy

**NOTE:** *I would like to hear your suggestions on these questions*

- Desired retention period for assistant logs and per-user history.
- Are users allowed to delete their conversation history?
- What PII fields must be redacted from analytics logs?
