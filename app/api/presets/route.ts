import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const presets = await prisma.topicPreset.findMany({
    where: { enabled: true },
    orderBy: [{ name: "asc" }],
  });

  const setting = await prisma.appSetting.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json({ presets, activePresetId: setting?.activePresetId ?? null });
}
