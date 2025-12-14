


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "chunk_count" integer,
    "text" "text" NOT NULL,
    "token_count" integer,
    "heading" "text",
    "heading_path" "text",
    "section_labels" "jsonb",
    "primary_modes" "jsonb",
    "archetype_bias" "jsonb",
    "language" "text",
    "disciplines" "jsonb",
    "platforms" "jsonb",
    "audiences" "jsonb",
    "visibility" "text",
    "confidentiality" "text",
    "guardrail_flags" "jsonb",
    "safety_notes" "text",
    "cta_links" "jsonb",
    "context_tags" "jsonb",
    "related_entities" "jsonb",
    "structured_refs" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "path" "text" NOT NULL,
    "title" "text",
    "summary" "text",
    "category" "text" NOT NULL,
    "doc_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "embed_mode" "text" NOT NULL,
    "pricing_sensitive" boolean DEFAULT false NOT NULL,
    "series_part_number" integer,
    "series_part_roman" "text",
    "series_part_title" "text",
    "series_chapter_code" "text",
    "series_chapter_title" "text",
    "series_chapter_global_index" integer,
    "series_chapter_part_index" integer,
    "language" "text" DEFAULT 'en'::"text",
    "disciplines" "jsonb",
    "platforms" "jsonb",
    "audiences" "jsonb",
    "tags" "jsonb",
    "visibility" "text" DEFAULT 'public'::"text",
    "confidentiality" "text" DEFAULT 'normal'::"text",
    "guardrail_flags" "jsonb",
    "safety_notes" "text",
    "source_version" "text",
    "source_checksum" "text",
    "author" "text",
    "approver" "text",
    "stakeholders" "jsonb",
    "license" "text",
    "ingested_at" timestamp with time zone,
    "last_updated" timestamp with time zone,
    "effective_from" timestamp with time zone,
    "expires_on" timestamp with time zone
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."embeddings" (
    "chunk_id" "uuid" NOT NULL,
    "embedding_model" "text" NOT NULL,
    "embedding" "public"."vector"(3072) NOT NULL,
    "embedding_norm" real,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perazzi_chunks" (
    "chunk_id" "text" NOT NULL,
    "doc_id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "embedding" "public"."vector"(1536) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."perazzi_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perazzi_conversation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "env" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "page_url" "text",
    "archetype" "text",
    "session_id" "text",
    "user_id" "text",
    "model" "text" NOT NULL,
    "used_gateway" boolean NOT NULL,
    "prompt" "text" NOT NULL,
    "response" "text" NOT NULL,
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "low_confidence" boolean,
    "intents" "text"[],
    "topics" "text"[],
    "metadata" "jsonb"
);


ALTER TABLE "public"."perazzi_conversation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qa_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interaction_id" "uuid" NOT NULL,
    "reason" "text",
    "notes" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL
);


ALTER TABLE "public"."qa_flags" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chunks"
    ADD CONSTRAINT "chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_path_key" UNIQUE ("path");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."embeddings"
    ADD CONSTRAINT "embeddings_pkey" PRIMARY KEY ("chunk_id");



ALTER TABLE ONLY "public"."perazzi_chunks"
    ADD CONSTRAINT "perazzi_chunks_pkey" PRIMARY KEY ("chunk_id");



ALTER TABLE ONLY "public"."perazzi_conversation_logs"
    ADD CONSTRAINT "perazzi_conversation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."qa_flags"
    ADD CONSTRAINT "qa_flags_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chunks_document_id" ON "public"."chunks" USING "btree" ("document_id");



CREATE UNIQUE INDEX "idx_chunks_document_id_chunk_index" ON "public"."chunks" USING "btree" ("document_id", "chunk_index");



CREATE INDEX "idx_chunks_heading_path" ON "public"."chunks" USING "btree" ("heading_path");



CREATE INDEX "idx_documents_category_doc_type_status" ON "public"."documents" USING "btree" ("category", "doc_type", "status");



CREATE INDEX "idx_documents_path" ON "public"."documents" USING "btree" ("path");



CREATE INDEX "idx_embeddings_hnsw_cosine" ON "public"."embeddings" USING "hnsw" ((("embedding")::"public"."halfvec"(3072)) "public"."halfvec_cosine_ops");



CREATE INDEX "perazzi_chunks_doc_id_idx" ON "public"."perazzi_chunks" USING "btree" ("doc_id");



CREATE INDEX "perazzi_chunks_embedding_idx" ON "public"."perazzi_chunks" USING "ivfflat" ("embedding") WITH ("lists"='100');



CREATE INDEX "perazzi_chunks_metadata_idx" ON "public"."perazzi_chunks" USING "gin" ("metadata");



CREATE INDEX "qa_flags_interaction_id_idx" ON "public"."qa_flags" USING "btree" ("interaction_id");



ALTER TABLE ONLY "public"."chunks"
    ADD CONSTRAINT "chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."embeddings"
    ADD CONSTRAINT "embeddings_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("id") ON DELETE CASCADE;



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;




