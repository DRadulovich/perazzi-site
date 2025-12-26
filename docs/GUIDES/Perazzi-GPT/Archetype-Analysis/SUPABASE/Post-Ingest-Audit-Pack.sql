-- 1) Documents: NULL vs non-NULL coverage
select
  count(*) as total,
  count(*) filter (where language is null) as language_null,
  count(*) filter (where summary is null) as summary_null,
  count(*) filter (where platforms is null) as platforms_null,
  count(*) filter (where disciplines is null) as disciplines_null,
  count(*) filter (where audiences is null) as audiences_null,
  count(*) filter (where tags is null) as tags_null
from public.documents;

-- 2) Chunks: NULL vs non-NULL coverage
select
  count(*) as total,
  count(*) filter (where language is null) as language_null,
  count(*) filter (where platforms is null) as platforms_null,
  count(*) filter (where disciplines is null) as disciplines_null,
  count(*) filter (where audiences is null) as audiences_null,
  count(*) filter (where context_tags is null) as context_tags_null,
  count(*) filter (where related_entities is null) as related_entities_null,
  count(*) filter (where token_count is null) as token_count_null
from public.chunks;

-- 3) Coverage by doc_type
select
  doc_type,
  count(*) as docs,
  count(*) filter (where language is null) as language_null,
  count(*) filter (where summary is null) as summary_null,
  count(*) filter (where platforms is null) as platforms_null,
  count(*) filter (where disciplines is null) as disciplines_null,
  count(*) filter (where tags is null) as tags_null
from public.documents
group by doc_type
order by docs desc;

-- 4) “Worst offenders”: docs still missing key metadata
select
  path, doc_type, title, language, summary, platforms, disciplines, audiences, tags
from public.documents
where language is null
   or summary is null
   or platforms is null
   or disciplines is null
   or tags is null
order by last_updated desc nulls last
limit 50;

-- 5) “Worst offenders”: chunks still missing key metadata
select
  d.path, d.doc_type, c.id as chunk_id, c.heading_path,
  c.language, c.platforms, c.disciplines, c.audiences, c.context_tags, c.related_entities, c.token_count
from public.chunks c
join public.documents d on d.id = c.document_id
where c.language is null
   or c.platforms is null
   or c.disciplines is null
   or c.context_tags is null
   or c.related_entities is null
order by d.path, c.chunk_index
limit 50;

-- 6) Distribution: document platforms
select
  platform,
  count(*) as docs
from public.documents d,
     lateral jsonb_array_elements_text(d.platforms) as platform
where d.platforms is not null
group by platform
order by docs desc, platform asc;

-- 7) Distribution: document disciplines
select
  discipline,
  count(*) as docs
from public.documents d,
     lateral jsonb_array_elements_text(d.disciplines) as discipline
where d.disciplines is not null
group by discipline
order by docs desc, discipline asc;

-- 8) Distribution: document tags
select
  tag,
  count(*) as docs
from public.documents d,
     lateral jsonb_array_elements_text(d.tags) as tag
where d.tags is not null
group by tag
order by docs desc, tag asc;

-- 9) Distribution: chunk related_entities
select
  entity,
  count(*) as chunks
from public.chunks c,
     lateral jsonb_array_elements_text(c.related_entities) as entity
where c.related_entities is not null
group by entity
order by chunks desc, entity asc;

-- 10) Distribution: chunk context_tags
select
  tag,
  count(*) as chunks
from public.chunks c,
     lateral jsonb_array_elements_text(c.context_tags) as tag
where c.context_tags is not null
group by tag
order by chunks desc, tag asc;
