-- Read-only audit pack for V2 metadata coverage
-- Run in Supabase SQL editor or psql. No writes.

-- 1) NULL vs non-NULL counts: documents
select
  count(*) as total_documents,
  count(*) filter (where summary is null) as summary_null,
  count(*) filter (where summary is not null) as summary_non_null,
  count(*) filter (where language is null) as language_null,
  count(*) filter (where language is not null) as language_non_null,
  count(*) filter (where platforms is null) as platforms_null,
  count(*) filter (where platforms is not null) as platforms_non_null,
  count(*) filter (where disciplines is null) as disciplines_null,
  count(*) filter (where disciplines is not null) as disciplines_non_null,
  count(*) filter (where audiences is null) as audiences_null,
  count(*) filter (where audiences is not null) as audiences_non_null,
  count(*) filter (where tags is null) as tags_null,
  count(*) filter (where tags is not null) as tags_non_null
from public.documents;

-- 2) NULL vs non-NULL counts: chunks
select
  count(*) as total_chunks,
  count(*) filter (where language is null) as language_null,
  count(*) filter (where language is not null) as language_non_null,
  count(*) filter (where token_count is null) as token_count_null,
  count(*) filter (where token_count is not null) as token_count_non_null,
  count(*) filter (where platforms is null) as platforms_null,
  count(*) filter (where platforms is not null) as platforms_non_null,
  count(*) filter (where disciplines is null) as disciplines_null,
  count(*) filter (where disciplines is not null) as disciplines_non_null,
  count(*) filter (where audiences is null) as audiences_null,
  count(*) filter (where audiences is not null) as audiences_non_null,
  count(*) filter (where context_tags is null) as context_tags_null,
  count(*) filter (where context_tags is not null) as context_tags_non_null,
  count(*) filter (where related_entities is null) as related_entities_null,
  count(*) filter (where related_entities is not null) as related_entities_non_null
from public.chunks;

-- 3) Worst offenders: documents missing metadata
select
  path,
  doc_type,
  summary is null as missing_summary,
  language is null as missing_language,
  platforms is null as missing_platforms,
  disciplines is null as missing_disciplines,
  audiences is null as missing_audiences,
  tags is null as missing_tags
from public.documents
where summary is null
   or language is null
   or platforms is null
   or disciplines is null
   or audiences is null
   or tags is null
order by path
limit 100;

-- 4) Worst offenders: chunks missing metadata
select
  d.path,
  c.id as chunk_id,
  c.chunk_index,
  c.language is null as missing_language,
  c.platforms is null as missing_platforms,
  c.disciplines is null as missing_disciplines,
  c.audiences is null as missing_audiences,
  c.context_tags is null as missing_context_tags,
  c.related_entities is null as missing_related_entities
from public.chunks c
join public.documents d on d.id = c.document_id
where c.language is null
   or c.platforms is null
   or c.disciplines is null
   or c.audiences is null
   or c.context_tags is null
   or c.related_entities is null
order by d.path, c.chunk_index
limit 200;

-- 5) Distribution: documents.platforms
select
  token,
  count(*) as doc_count
from public.documents
cross join lateral jsonb_array_elements_text(coalesce(platforms, '[]'::jsonb)) as token
group by token
order by doc_count desc, token asc;

-- 6) Distribution: documents.disciplines
select
  token,
  count(*) as doc_count
from public.documents
cross join lateral jsonb_array_elements_text(coalesce(disciplines, '[]'::jsonb)) as token
group by token
order by doc_count desc, token asc;

-- 7) Distribution: documents.tags
select
  token,
  count(*) as doc_count
from public.documents
cross join lateral jsonb_array_elements_text(coalesce(tags, '[]'::jsonb)) as token
group by token
order by doc_count desc, token asc;

-- 8) Distribution: chunks.platforms
select
  token,
  count(*) as chunk_count
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(platforms, '[]'::jsonb)) as token
group by token
order by chunk_count desc, token asc;

-- 9) Distribution: chunks.disciplines
select
  token,
  count(*) as chunk_count
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(disciplines, '[]'::jsonb)) as token
group by token
order by chunk_count desc, token asc;

-- 10) Distribution: chunks.context_tags
select
  token,
  count(*) as chunk_count
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(context_tags, '[]'::jsonb)) as token
group by token
order by chunk_count desc, token asc;

-- 11) Distribution: chunks.related_entities
select
  token,
  count(*) as chunk_count
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(related_entities, '[]'::jsonb)) as token
group by token
order by chunk_count desc, token asc;

-- 12) Sanity: ensure jsonb arrays only (documents)
select
  count(*) filter (where platforms is not null and jsonb_typeof(platforms) <> 'array') as platforms_non_array,
  count(*) filter (where disciplines is not null and jsonb_typeof(disciplines) <> 'array') as disciplines_non_array,
  count(*) filter (where audiences is not null and jsonb_typeof(audiences) <> 'array') as audiences_non_array,
  count(*) filter (where tags is not null and jsonb_typeof(tags) <> 'array') as tags_non_array
from public.documents;

-- 13) Sanity: ensure jsonb arrays only (chunks)
select
  count(*) filter (where platforms is not null and jsonb_typeof(platforms) <> 'array') as platforms_non_array,
  count(*) filter (where disciplines is not null and jsonb_typeof(disciplines) <> 'array') as disciplines_non_array,
  count(*) filter (where audiences is not null and jsonb_typeof(audiences) <> 'array') as audiences_non_array,
  count(*) filter (where context_tags is not null and jsonb_typeof(context_tags) <> 'array') as context_tags_non_array,
  count(*) filter (where related_entities is not null and jsonb_typeof(related_entities) <> 'array') as related_entities_non_array
from public.chunks;

-- 14) Token casing/spacing checks (documents)
select
  'platforms' as field,
  count(*) as bad_tokens
from public.documents
cross join lateral jsonb_array_elements_text(coalesce(platforms, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s'
union all
select
  'disciplines' as field,
  count(*) as bad_tokens
from public.documents
cross join lateral jsonb_array_elements_text(coalesce(disciplines, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s'
union all
select
  'audiences' as field,
  count(*) as bad_tokens
from public.documents
cross join lateral jsonb_array_elements_text(coalesce(audiences, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s'
union all
select
  'tags' as field,
  count(*) as bad_tokens
from public.documents
cross join lateral jsonb_array_elements_text(coalesce(tags, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s';

-- 15) Token casing/spacing checks (chunks)
select
  'platforms' as field,
  count(*) as bad_tokens
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(platforms, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s'
union all
select
  'disciplines' as field,
  count(*) as bad_tokens
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(disciplines, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s'
union all
select
  'audiences' as field,
  count(*) as bad_tokens
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(audiences, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s'
union all
select
  'context_tags' as field,
  count(*) as bad_tokens
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(context_tags, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s'
union all
select
  'related_entities' as field,
  count(*) as bad_tokens
from public.chunks
cross join lateral jsonb_array_elements_text(coalesce(related_entities, '[]'::jsonb)) as token
where token ~ '[A-Z]' or token ~ '\s';

-- 16) Doc-type success thresholds (spot check)
-- model-spec-text + base-model-index: related_entities present
select
  d.doc_type,
  count(*) as chunks_total,
  count(*) filter (where coalesce(jsonb_array_length(c.related_entities), 0) > 0) as chunks_with_related,
  round(
    100.0 * count(*) filter (where coalesce(jsonb_array_length(c.related_entities), 0) > 0)
    / nullif(count(*), 0),
    2
  ) as pct_with_related
from public.chunks c
join public.documents d on d.id = c.document_id
where d.doc_type in ('model-spec-text', 'base-model-index')
group by d.doc_type
order by d.doc_type;

-- platform-guide: platforms + related_entities present
select
  d.doc_type,
  count(*) as chunks_total,
  count(*) filter (
    where coalesce(jsonb_array_length(c.platforms), 0) > 0
      and coalesce(jsonb_array_length(c.related_entities), 0) > 0
  ) as chunks_with_platform_and_related,
  round(
    100.0 * count(*) filter (
      where coalesce(jsonb_array_length(c.platforms), 0) > 0
        and coalesce(jsonb_array_length(c.related_entities), 0) > 0
    ) / nullif(count(*), 0),
    2
  ) as pct_with_platform_and_related
from public.chunks c
join public.documents d on d.id = c.document_id
where d.doc_type = 'platform-guide'
group by d.doc_type;

-- discipline-index: disciplines present
select
  d.doc_type,
  count(*) as chunks_total,
  count(*) filter (where coalesce(jsonb_array_length(c.disciplines), 0) > 0) as chunks_with_disciplines,
  round(
    100.0 * count(*) filter (where coalesce(jsonb_array_length(c.disciplines), 0) > 0)
    / nullif(count(*), 0),
    2
  ) as pct_with_disciplines
from public.chunks c
join public.documents d on d.id = c.document_id
where d.doc_type = 'discipline-index'
group by d.doc_type;

-- dealer-directory + service-centers: context_tags expected
select
  d.doc_type,
  count(*) as chunks_total,
  count(*) filter (where coalesce(jsonb_array_length(c.context_tags), 0) > 0) as chunks_with_context_tags,
  round(
    100.0 * count(*) filter (where coalesce(jsonb_array_length(c.context_tags), 0) > 0)
    / nullif(count(*), 0),
    2
  ) as pct_with_context_tags
from public.chunks c
join public.documents d on d.id = c.document_id
where d.doc_type in ('dealer-directory', 'service-centers')
group by d.doc_type
order by d.doc_type;
