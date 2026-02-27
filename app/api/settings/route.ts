import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const setting = await prisma.appSetting.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({ activePresetId: setting?.activePresetId ?? null });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const activePresetId = typeof body.activePresetId === "string" ? body.activePresetId : null;

  const updated = await prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: { activePresetId },
    create: { id: "singleton", activePresetId },
  });

  return NextResponse.json({ setting: updated });
}
