import { NextResponse } from "next/server";

import { getManufactureYearBySerial } from "@/sanity/queries/manufactureYear";

const parseSerial = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9]/g, "");
    if (!cleaned) return null;
    return Number(cleaned);
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const serialInput = parseSerial(body.serial);

    if (!serialInput || serialInput <= 0) {
      return NextResponse.json({ error: "Enter a valid serial number." }, { status: 400 });
    }

    const match = await getManufactureYearBySerial(serialInput);

    if (!match) {
      return NextResponse.json({ error: "Serial number not found." }, { status: 404 });
    }

    return NextResponse.json({
      serial: serialInput,
      year: match.year,
      proofCode: match.proofCode,
      matchType: match.matchType,
      model: match.model ?? null,
      range: match.range,
    });
  } catch (error) {
    console.error("[serial-lookup]", error);
    return NextResponse.json({ error: "Unable to process lookup right now." }, { status: 500 });
  }
}
