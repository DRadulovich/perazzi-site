import { NextResponse } from "next/server";
import { Client } from "pg";

import { getPgSslDiagnostics, getPgSslOptions } from "@/lib/pgSsl";
import { withAdminAuth } from "@/lib/withAdminAuth";
import { logTlsDiagForDb } from "@/lib/tlsDiag";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await withAdminAuth();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "CONFIG_MISSING", detail: "DATABASE_URL not set" }, { status: 503 });
  }

  const ssl = getPgSslOptions();
  const { sslMode, hasCa } = getPgSslDiagnostics();
  logTlsDiagForDb("pg.alert.stream", connectionString, sslMode, { hasCa });

  // 5-second connection timeout to fail fast on network issues
  const client = new Client({ connectionString, ssl, connectionTimeoutMillis: 5_000 });

  try {
    await client.connect();
    await client.query("LISTEN archetype_alert");
  } catch (error) {
    console.error("[pgpt-insights] failed to LISTEN archetype_alert", error);
    await client.end().catch(() => {});
    return NextResponse.json({ error: "PG_LISTEN_FAILED", detail: (error as Error).message }, { status: 503 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      send({ type: "connected", at: new Date().toISOString() });

      const onNotification = (msg: { payload?: string | null }) => {
        const rawPayload = msg.payload ?? null;
        let payload: unknown;
        try {
          payload = rawPayload ? JSON.parse(rawPayload) : rawPayload;
        } catch {
          payload = { message: rawPayload };
        }

        send({
          type: "alert",
          payload,
          at: new Date().toISOString(),
        });
      };

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
      }, 30_000);

      client.on("notification", onNotification);

      const close = async () => {
        clearInterval(heartbeat);
        client.removeListener("notification", onNotification);
        try {
          await client.query("UNLISTEN archetype_alert");
        } catch {
          // ignore
        }
        await client.end().catch(() => {});
      };

      request.signal.addEventListener("abort", () => {
        close().catch(() => {});
        controller.close();
      });
    },
    async cancel() {
      try {
        await client.end();
      } catch {
        // ignore
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
