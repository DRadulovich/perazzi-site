# Sanity Vision Sample Queries

Paste any of the snippets below into Vision (`/next-studio` → Vision tool) to confirm that the expected image fields exist and resolve to `{url, alt, caption}` data. Each query scopes to the first document of its type; adjust the filter if you need a different entry.

## Shotguns Landing
```groq
*[_type == "shotgunsLanding"][0]{
  hero{
    title,
    subheading,
    background{ "url": asset->url, alt, caption }
  },
  triggerExplainer{
    title,
    diagram{ "url": asset->url, alt, caption }
  },
  teasers{
    engraving{ "url": asset->url, alt },
    wood{ "url": asset->url, alt }
  },
  disciplineHubs[]{
    key,
    title,
    summary,
    championImage{ "url": asset->url, alt }
  }
}
```

## Platforms (MX/HT/TM)
```groq
*[_type == "platform"]{
  name,
  slug,
  hero{ "url": asset->url, alt, caption },
  highlights[]{
    title,
    media{ "url": asset->url, alt }
  },
  champion{
    name,
    quote,
    image{ "url": asset->url, alt }
  }
}
```

## Disciplines
```groq
*[_type == "discipline"]{
  name,
  slug,
  hero{ "url": asset->url, alt },
  championImage{ "url": asset->url, alt }
}
```

## Grades
```groq
*[_type == "grade"]{
  name,
  hero{ "url": asset->url, alt },
  engravingGallery[]{ "url": asset->url, alt, caption },
  woodImages[]{ "url": asset->url, alt, caption }
}
```

## Bespoke Home
```groq
*[_type == "bespokeHome"][0]{
  hero{
    eyebrow,
    title,
    media{ "url": asset->url, alt, caption }
  },
  steps[]{
    title,
    media{ "url": asset->url, alt }
  },
  experts[]{
    name,
    role,
    headshot{ "url": asset->url, alt }
  },
  assuranceImage{ "url": asset->url, alt }
}
```

## Experience Home
```groq
*[_type == "experienceHome"][0]{
  hero{
    title,
    background{ "url": asset->url, alt }
  },
  picker[]{
    title,
    media{ "url": asset->url, alt }
  },
  mosaic[]{ "url": asset->url, alt }
}
```

## Heritage Home
```groq
*[_type == "heritageHome"][0]{
  hero{
    title,
    background{ "url": asset->url, alt }
  },
  photoEssay[]{ "url": asset->url, alt, caption },
  oralHistories[]{
    title,
    quote,
    image{ "url": asset->url, alt }
  }
}
```

## Heritage Events
```groq
*[_type == "heritageEvent"]{
  title,
  date,
  media{ "url": asset->url, alt, caption }
}
```

## Service Home
```groq
*[_type == "serviceHome"][0]{
  hero{
    title,
    background{ "url": asset->url, alt }
  }
}
```

## Journal Landing & Featured Article
```groq
{
  "landing": *[_type == "journalLanding"][0]{
    hero{
      title,
      background{ "url": asset->url, alt }
    },
    featuredArticle->{
      title,
      heroImage{
        "url": asset->url,
        alt
      }
    }
  },
  "authors": *[_type == "author"]{
    name,
    headshot{ "url": asset->url, alt }
  }
}
```

## Latest Verification (2025-11-07)
- ✅ Shotguns Landing – hero background, trigger diagram, teasers, and discipline hub images all return CDN URLs.
- ⚠️ Platforms – query currently resolves to an empty array; publish at least one Platform with hero/highlight/champion media.
- ⚠️ Disciplines – documents exist but lack `hero`/`championImage` assets (nulls returned); upload imagery before wiring the route.
- ⚠️ Grades – query returns no documents; create at least one Grade entry with engraving/wood galleries.
- ✅ Bespoke Home – hero, all six steps, experts, and assurance image return URLs.
- ✅ Experience Home – hero, picker cards, and mosaic tiles have URLs.
- ⚠️ Heritage Home – hero background resolved, but `photoEssay` and `oralHistories` arrays are empty; add media per spec.
- ✅ Service Home – hero background image present.
- ✅ Journal Landing / Author – landing hero background, featured hero image, and author headshot all return URLs.
