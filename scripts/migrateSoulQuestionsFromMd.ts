/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

import sanityConfig from "../sanity.config";

const client = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  apiVersion: "2023-10-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

type SoulQuestionEntry = {
  stepNumber: string;
  title: string;
  soulQuestion: string;
};

function parseSoulQuestionsFromMarkdown(mdPath: string): SoulQuestionEntry[] {
  const raw = fs.readFileSync(mdPath, "utf8");

  const sections = raw.split(/^##\s+/m).filter((block) => block.trim().length > 0);

  const entries: SoulQuestionEntry[] = [];
  const headingRegex = /^(\d{2})\s+–\s+(.+?)\s*$/;
  const soulQuestionRegex =
    /###\s+SoulQuestion\s+([\s\S]*?)\n###\s+ArtisanPromptTemplate/;

  for (const section of sections) {
    // section starts with something like: "01 – Action & Receiver Machining\n\n### SoulQuestion\n..."
    const [headingLine, ...rest] = section.split("\n");
    const headingMatch = headingRegex.exec(headingLine);

    if (!headingMatch) {
      console.warn("Skipping section with unrecognized heading:", headingLine);
      continue;
    }

    const stepNumber = headingMatch[1];
    const title = headingMatch[2];

    const block = rest.join("\n");

    // Extract the SoulQuestion block between "### SoulQuestion" and "### ArtisanPromptTemplate"
    const soulQuestionMatch = soulQuestionRegex.exec(block);

    if (!soulQuestionMatch) {
      console.warn("No SoulQuestion found for heading:", headingLine);
      continue;
    }

    const soulQuestionRaw = soulQuestionMatch[1].trim();

    // SoulQuestion text might be one or more lines; collapse into a single paragraph
    const soulQuestion = soulQuestionRaw.replaceAll(/\s*\n\s*/g, " ").trim();

    entries.push({
      stepNumber,
      title,
      soulQuestion,
    });
  }

  return entries;
}

async function run() {
  const mdPath = path.join(process.cwd(), "docs", "GUIDES", "Soul-Questions-and-Prompts.md");

  console.log("Reading soul questions from:", mdPath);
  const entries = parseSoulQuestionsFromMarkdown(mdPath);

  console.log(`Found ${entries.length} entries in markdown.`);

  for (const entry of entries) {
    const { stepNumber, title, soulQuestion } = entry;

    console.log(`\n[Step ${stepNumber}] Title: ${title}`);
    console.log(`SoulQuestion: ${soulQuestion}`);

    // Find the matching article by title
    const docs: { _id: string; title: string }[] = await client.fetch(
      `*[_type == "article" && title == $title][0...5]{ _id, title }`,
      { title },
    );

    if (!docs || docs.length === 0) {
      console.warn(`  ⚠ No article found with title "${title}". Skipping.`);
      continue;
    }

    if (docs.length > 1) {
      console.warn(
        `  ⚠ Multiple articles found with title "${title}". Using the first one but you may want to double-check.`,
      );
    }

    const doc = docs[0];

    console.log(`  → Patching article ${doc._id} (${doc.title})`);

    await client.patch(doc._id).set({ soulQuestion }).commit();

    console.log("  ✓ soulQuestion updated.");
  }

  console.log("\nDone updating soulQuestion for all matched articles.");
}

try {
  await run();
} catch (err) {
  console.error(err);
  process.exit(1);
}

// To run this script:
// 1. Ensure SANITY_WRITE_TOKEN is set in your environment with write access.
// 2. From the project root, run:
//      pnpm ts-node scripts/migrateSoulQuestionsFromMd.ts
//    or transpile and use `node` depending on your setup.
