import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 모델 우선순위: gpt-4.1-mini → gpt-4o-mini (폴백)
const MODEL_PRIMARY = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const MODEL_FALLBACK = "gpt-4o-mini";
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 30000);

type CandidateWithItem = {
    id: string;
    ruleScore: number;
    item: {
        id: string;
        title: string;
        summary: string | null;
        url: string;
        source: { name: string };
    };
};

type AiRankResult = {
    top10: Array<{ rank: number; candidateId: string; reason: string }>;
    model: string;
    tokensUsed: number;
};

const PRESET_PROMPT: Record<string, { role: string; criteria: string[] }> = {
    society: {
        role: "한국 사회 이슈 콘텐츠 기획자",
        criteria: [
            "파급력이 크고 사회적 공분 또는 경각심을 일으키는 사건·사고·범죄",
            '"무슨 일이 일어났고, 어떤 의미인가" 명확한 스토리가 있는 것',
            "시의성 있고 화제성 높은 사건 (수사 결과, 판결, 사고 경위 등)",
            "쇼츠 1분 또는 블로그 1편으로 설명 가능한 핵심이 있는 것",
            "단순 보도자료·기념식·행사 홍보는 제외",
        ],
    },
    entertainment: {
        role: "한국 연예·대중문화 콘텐츠 기획자",
        criteria: [
            "현재 화제가 되고 있는 연예인·드라마·영화·음악 소식",
            '"왜 지금 핫한가" 명확한 이유가 있는 것 (흥행, 역주행, 논란, 컴백, 시청률 등)',
            "팬덤 반응이나 대중의 관심이 집중되는 시의성 있는 것",
            "쇼츠 1분 또는 블로그 1편으로 설명 가능한 핵심이 있는 것",
            "단순 일정 공지·보도자료·기념식은 제외",
        ],
    },
    _default: {
        role: "한국 정책·생활·금융 정보 콘텐츠 기획자",
        criteria: [
            "일반 대중(직장인·주부·청년)의 실제 생활에 직접적인 영향을 미치는 변화",
            '"무엇이 바뀌었고, 나에게 어떤 영향인지" 명확한 스토리가 있는 것',
            "신선하고 시의성 있는 정보 (새로운 제도, 정책 변경, 금액 변동 등)",
            "쇼츠 1분 또는 블로그 1편으로 설명 가능한 핵심이 있는 것",
            "단순 행사/기념식/인터뷰/사건사고는 제외",
        ],
    },
};

function buildPrompt(
    presetName: string,
    presetSlug: string,
    presetDescription: string | null,
    candidates: CandidateWithItem[]
): string {
    const articleList = candidates
        .map((c, i) => {
            const summary = c.item.summary
                ? c.item.summary.slice(0, 200)
                : "(요약 없음)";
            return `[${i + 1}] id:${c.id}\n제목: ${c.item.title}\n요약: ${summary}\n출처: ${c.item.source.name} | 룰점수: ${c.ruleScore}`;
        })
        .join("\n\n");

    const { role, criteria } = PRESET_PROMPT[presetSlug] ?? PRESET_PROMPT._default;
    const criteriaText = criteria.map((c) => `- ${c}`).join("\n");

    return `당신은 ${role}입니다.
주제: "${presetName}"${presetDescription ? ` (${presetDescription})` : ""}

아래 뉴스 기사 ${candidates.length}개 중, 이 주제로 유튜브 쇼츠 또는 블로그 포스팅 소재로 가장 적합한 기사 TOP 10을 선정해주세요.

선정 기준:
${criteriaText}

--- 기사 목록 ---
${articleList}

JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "top10": [
    { "rank": 1, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 2, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 3, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 4, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 5, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 6, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 7, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 8, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 9, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" },
    { "rank": 10, "candidateId": "후보id", "reason": "선정 이유 (한 문장)" }
  ]
}`;
}

async function callOpenAI(
    client: OpenAI,
    model: string,
    prompt: string
): Promise<{ content: string; tokensUsed: number }> {
    const res = await client.chat.completions.create(
        {
            model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 3000,
        },
        { timeout: TIMEOUT_MS }
    );

    return {
        content: res.choices[0]?.message?.content ?? "{}",
        tokensUsed: res.usage?.total_tokens ?? 0,
    };
}

export async function runAiRank(params: {
    runId: string;
    presetName: string;
    presetSlug?: string | null;
    presetDescription?: string | null;
}): Promise<AiRankResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");

    const client = new OpenAI({ apiKey });

    // ruleScore >= 0인 후보 전체 조회 (노이즈 제거만, 최대 50개로 제한하여 타임아웃 방지)
    const candidates = await prisma.candidate.findMany({
        where: {
            runId: params.runId,
            ruleScore: { gte: 0 },
        },
        orderBy: [{ ruleScore: "desc" }],
        take: 50,
        include: {
            item: {
                include: { source: true },
            },
        },
    });

    if (candidates.length === 0) {
        throw new Error("AI 판정할 후보가 없습니다 (ruleScore >= 0인 것이 없음).");
    }

    const prompt = buildPrompt(
        params.presetName,
        params.presetSlug ?? "_default",
        params.presetDescription ?? null,
        candidates
    );

    // gpt-4o-mini 우선, 실패 시 gpt-4.1-mini 폴백
    let content: string;
    let tokensUsed: number;
    let usedModel = MODEL_PRIMARY;

    try {
        const result = await callOpenAI(client, MODEL_PRIMARY, prompt);
        content = result.content;
        tokensUsed = result.tokensUsed;
    } catch (primaryErr) {
        console.warn(`[AI Rank] ${MODEL_PRIMARY} 실패, ${MODEL_FALLBACK}로 폴백:`, primaryErr);
        usedModel = MODEL_FALLBACK;
        const result = await callOpenAI(client, MODEL_FALLBACK, prompt);
        content = result.content;
        tokensUsed = result.tokensUsed;
    }

    // JSON 파싱
    let parsed: { top10?: Array<{ rank: number; candidateId: string; reason: string }> };
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error(`GPT 응답 JSON 파싱 실패: ${content.slice(0, 200)}`);
    }

    const top10 = parsed.top10 ?? [];
    if (top10.length === 0) {
        throw new Error("GPT 응답에 top10 데이터가 없습니다.");
    }

    // DB에 rank 저장
    for (const item of top10) {
        const candidate = candidates.find((c) => c.id === item.candidateId);
        if (!candidate) {
            console.warn(`[AI Rank] candidateId ${item.candidateId} 를 찾을 수 없음 — 건너뜀`);
            continue;
        }
        await prisma.candidate.update({
            where: { id: item.candidateId },
            data: {
                rank: item.rank,
                // reason을 reasonsJson에 ai 항목으로 추가
                reasonsJson: JSON.stringify([
                    ...(() => { try { return JSON.parse(candidate.reasonsJson ?? "[]"); } catch { return []; } })(),
                    `ai:${item.reason}`,
                ]),
            },
        });
    }

    // Run 업데이트 (AI 사용 정보)
    await prisma.run.update({
        where: { id: params.runId },
        data: {
            aiUsed: true,
            aiCalls: 1,
            aiTokensEst: tokensUsed,
            // gpt-4o-mini: input $0.15/1M, output $0.60/1M → 대략 1000토큰당 0.15원
            aiCostEstKrw: Math.round((tokensUsed / 1_000_000) * 150 * 1400),
        },
    });

    return { top10: top10.map((t: { rank: number; candidateId: string; reason: string }) => ({ rank: t.rank, candidateId: t.candidateId, reason: t.reason })), model: usedModel, tokensUsed };
}
