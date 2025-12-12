import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: Request) {
  const formData = await request.formData();
  const interactionId = formData.get("interactionId");

  if (!interactionId || typeof interactionId !== "string") {
    return NextResponse.redirect(new URL("/admin/pgpt-insights", request.url));
  }

  try {
    await pool.query(
      `
        insert into qa_flags (interaction_id, status)
        values ($1, 'open');
      `,
      [interactionId],
    );
  } catch (error) {
    console.error("Failed to insert QA flag", error);
  }

  return NextResponse.redirect(new URL("/admin/pgpt-insights/qa", request.url));
}
