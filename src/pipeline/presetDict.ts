import { PrismaClient } from "@prisma/client";
import type { KeywordDict } from "@/src/config/keywords";

const prisma = new PrismaClient();

export async function getActivePresetId(): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { id: "singleton" } });
  return setting?.activePresetId ?? null;
}

export async function loadPresetDict(presetId: string | null): Promise<{ preset: { id: string; slug: string; name: string } | null; dict: KeywordDict | null }> {
  if (!presetId) return { preset: null, dict: null };

  const preset = await prisma.topicPreset.findUnique({
    where: { id: presetId },
    select: { id: true, slug: true, name: true },
  });
  if (!preset) return { preset: null, dict: null };

  const keywords = await prisma.topicKeyword.findMany({
    where: { presetId },
    select: { group: true, keyword: true, weight: true },
  });

  const dict: KeywordDict = { change: {}, life: {}, noise: {} };
  for (const k of keywords) {
    if (k.group === "change") dict.change[k.keyword] = k.weight;
    if (k.group === "life") dict.life[k.keyword] = k.weight;
    if (k.group === "noise") dict.noise[k.keyword] = k.weight;
  }

  return { preset, dict };
}
