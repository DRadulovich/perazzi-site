# Public-facing URLs (no secrets)
NEXT_PUBLIC_SITE_URL=https://perazzi.example.com
NEXT_PUBLIC_SANITY_PREVIEW_ORIGIN=http://localhost:3000

# Sanity configuration (IDs & versions are not secrets, but tokens are)
SANITY_PROJECT_ID=perazzi-project-id
SANITY_DATASET=production
SANITY_API_VERSION=2025-01-01

NEXT_PUBLIC_SANITY_PROJECT_ID=perazzi-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01

# Sanity tokens – REPLACE with real tokens in your local .env files
SANITY_WRITE_TOKEN=WRITE_TOKEN_REPLACE_ME
SANITY_READ_TOKEN=READ_TOKEN_REPLACE_ME

# ⚠️ This pattern will be removed later when we fix S-002
NEXT_PUBLIC_SANITY_BROWSER_TOKEN=DO_NOT_USE_IN_PROD_REPLACE_ME

# Cloudinary – account + API credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=CLOUDINARY_KEY_REPLACE_ME
CLOUDINARY_API_SECRET=CLOUDINARY_SECRET_REPLACE_ME

# Analytics – public write key (still keep real value out of git)
NEXT_PUBLIC_ANALYTICS_WRITE_KEY=ANALYTICS_WRITE_KEY_REPLACE_ME

# Cal.com platform (needed for the booking scheduler)
NEXT_PUBLIC_CAL_OAUTH_CLIENT_ID=CAL_CLIENT_ID_REPLACE_ME
NEXT_PUBLIC_CAL_API_URL=https://api.cal.com/v2

# === AI / OpenAI / PerazziGPT configuration ===
# Used for embeddings + Concierge API and related AI features.
#
# Local dev:
#   - Set OPENAI_API_KEY.
#   - Leave AI_GATEWAY_URL and AI_GATEWAY_TOKEN empty.
#
# Production (Vercel):
#   - Configure AI Gateway with your OpenAI key.
#   - Set AI_GATEWAY_URL and AI_GATEWAY_TOKEN from Vercel AI Gateway.
#   - Do NOT set OPENAI_API_KEY directly in Vercel for production unless you intentionally want to allow a direct-bypass fallback.

# Direct OpenAI key (used in local dev or when Gateway is not configured)
OPENAI_API_KEY=sk-REPLACE_ME

# Vercel AI Gateway endpoint and token (used in production/remote environments)
AI_GATEWAY_URL=
AI_GATEWAY_TOKEN=

# Optional override: "true" to force direct OpenAI via OPENAI_API_KEY even if AI_GATEWAY_* are set (useful for local/CLI)
AI_FORCE_DIRECT=

# Perazzi-specific model and behavior settings
PERAZZI_COMPLETIONS_MODEL=gpt-4.1             # Chat model for assistant responses
PERAZZI_EMBED_MODEL=text-embedding-3-large    # Embedding model for retrieval
PERAZZI_MAX_COMPLETION_TOKENS=                # Max completion tokens per request
PERAZZI_RETRIEVAL_LIMIT=                      # How many chunks to fetch from vector search
PERAZZI_LOW_CONF_THRESHOLD=                   # Threshold for low-confidence responses
PERAZZI_ENABLE_FILE_LOG=                      # "true" to write conversation logs locally
EMBED_BATCH_SIZE=64                           # Batch size for embedding ingest scripts
PERAZZI_AI_LOGGING_ENABLED=                   # Reserved for future app-level AI logging toggle

# Postgres / pgvector for the knowledge base
DATABASE_URL=postgres://user:password@localhost:5433/perazzi
PGVECTOR_DIM=1536          # match your embedding model's dimension
PGSSL_MODE=disable         # "require" in prod, "disable" for local dev
