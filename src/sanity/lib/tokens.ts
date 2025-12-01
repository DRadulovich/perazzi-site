export const serverToken =
  process.env.SANITY_API_READ_TOKEN ||
  process.env.SANITY_READ_TOKEN ||
  process.env.SANITY_STUDIO_TOKEN ||
  undefined

export const browserToken = process.env.NEXT_PUBLIC_SANITY_BROWSER_TOKEN
