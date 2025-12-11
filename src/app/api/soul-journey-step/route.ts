import { NextResponse } from "next/server";
import { runChatCompletion } from "@/lib/aiClient";
import { getSoulArtisanPromptForStep } from "@/lib/soulJourneyPrompts";

const OPENAI_MODEL = process.env.PERAZZI_COMPLETIONS_MODEL ?? "gpt-4.1";
const MAX_COMPLETION_TOKENS = Number(process.env.PERAZZI_MAX_COMPLETION_TOKENS ?? 700);

export async function POST(req: Request) {
  try {
    const { step, userAnswer, title } = await req.json();

    if (!step || typeof step !== "string") {
      return NextResponse.json({ error: "Missing or invalid step" }, { status: 400 });
    }
    if (!userAnswer || typeof userAnswer !== "string") {
      return NextResponse.json({ error: "Missing or invalid userAnswer" }, { status: 400 });
    }

    const template = getSoulArtisanPromptForStep(step);
    if (!template) {
      return NextResponse.json({ error: "Unknown step" }, { status: 400 });
    }

    const trimmedAnswer = userAnswer.trim();
    const prompt = template.replaceAll("{{USER_ANSWER}}", trimmedAnswer);
    const titleLine = title && typeof title === "string" ? `Step title: ${title}\n\n` : "";

    const completion = await runChatCompletion({
      model: OPENAI_MODEL,
      temperature: 0.6,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
      messages: [
        {
          role: "system",
          content:
            "You are a Perazzi master craftsperson. Stay concise (1–2 paragraphs), grounded in the station's craft, and follow the provided prompt exactly. Do not mention prompts, websites, or meta-instructions.",
        },
        { role: "user", content: `${titleLine}${prompt}` },
      ],
    });

    const paragraph = completion.choices[0]?.message?.content?.trim();
    if (!paragraph) {
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }

    return NextResponse.json({ paragraph });
  } catch (error) {
    console.error("[soul-journey-step]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
