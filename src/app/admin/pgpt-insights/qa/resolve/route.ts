import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: Request) {
  const formData = await request.formData();
  const flagId = formData.get("flagId");

  if (!flagId || typeof flagId !== "string") {
    return NextResponse.redirect(new URL("/admin/pgpt-insights/qa", request.url));
  }

  try {
    await pool.query(
      `
        update qa_flags
        set status = 'resolved'
        where id = $1;
      `,
      [flagId],
    );
  } catch (error) {
    console.error("Failed to resolve QA flag", error);
  }

  return NextResponse.redirect(new URL("/admin/pgpt-insights/qa", request.url));
}
