import { simplifyForMatch } from "@/src/lib/text";
import { defaultKeywordDict, ruleWeights, type KeywordDict } from "@/src/config/keywords";

export type RuleScoreResult = { ruleScore: number; reasons: string[]; raw: number };

function scoreText(text: string, dict: KeywordDict) {
  const s = simplifyForMatch(text);
  const hits: { k: string; v: number }[] = [];

  const addHits = (m: Record<string, number>) => {
    for (const [k, v] of Object.entries(m)) {
      if (s.includes(k)) hits.push({ k, v });
    }
  };
  addHits(dict.change);
  addHits(dict.life);
  // noise are negative weights
  for (const [k, v] of Object.entries(dict.noise)) {
    if (s.includes(k)) hits.push({ k, v });
  }

  const sum = hits.reduce((acc, h) => acc + h.v, 0);
  return { sum, hits };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeRuleScore(params: {
  title: string;
  summary?: string | null;
  contentText?: string | null;
  sourceId: string;
  dict?: KeywordDict;
}): RuleScoreResult {
  const dict = params.dict ?? defaultKeywordDict;
  const reasons: string[] = [];

  const title = scoreText(params.title, dict);
  let raw = title.sum * ruleWeights.title;
  for (const h of title.hits) reasons.push(`title:${h.k}(${h.v > 0 ? "+" : ""}${h.v})`);

  if (params.summary) {
    const summary = scoreText(params.summary, dict);
    raw += summary.sum * ruleWeights.summary;
    for (const h of summary.hits) reasons.push(`summary:${h.k}(${h.v > 0 ? "+" : ""}${h.v})`);
  }

  if (params.contentText) {
    const content = scoreText(params.contentText, dict);
    raw += content.sum * ruleWeights.content;
    for (const h of content.hits) reasons.push(`content:${h.k}(${h.v > 0 ? "+" : ""}${h.v})`);
  }

  const isGov = ["korea_policy", "mohw_press", "moel_policy", "moef_press", "molit_press"].includes(params.sourceId);
  const isEconPress = ["mk_economy", "hk_economy", "donga_economy"].includes(params.sourceId);
  if (isGov) {
    raw += ruleWeights.govBonus;
    reasons.push(`bonus:gov(+${ruleWeights.govBonus})`);
  } else if (isEconPress) {
    raw += ruleWeights.econPressBonus;
    reasons.push(`bonus:econpress(+${ruleWeights.econPressBonus})`);
  }

  // synergy bonus: change + life
  const hasChange = Object.keys(dict.change).some(k => simplifyForMatch(params.title + " " + (params.summary ?? "")).includes(k));
  const hasLife = Object.keys(dict.life).some(k => simplifyForMatch(params.title + " " + (params.summary ?? "")).includes(k));
  if (hasChange && hasLife) {
    raw += ruleWeights.synergyBonus;
    reasons.push(`bonus:synergy(+${ruleWeights.synergyBonus})`);
  }

  // promo cap: if obvious promo/event terms appear
  const promoTerms = ["개최", "기념식", "캠페인", "행사", "간담회", "토론회"];
  const promoHit = promoTerms.some(t => simplifyForMatch(params.title + " " + (params.summary ?? "")).includes(t));
  let ruleScore = clamp(Math.round(raw), 0, 40);
  if (promoHit) {
    ruleScore = Math.min(ruleScore, ruleWeights.promoCapMax);
    reasons.push(`cap:promo(max ${ruleWeights.promoCapMax})`);
  }

  return { ruleScore, reasons, raw };
}
