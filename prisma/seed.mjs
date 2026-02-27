import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertSources() {
  const sources = [
    // ─── 정부 공식 (null = 모든 프리셋에서 항상 수집) ───────────────────
    {
      name: "정책브리핑 정책뉴스", sourceId: "korea_policy",
      type: "rss", url: "https://www.korea.kr/rss/policy.xml",
      enabled: true, weight: 10, presetSlugs: null,
    },
    {
      name: "보건복지부 보도자료", sourceId: "mohw_press",
      type: "rss", url: "http://www.mohw.go.kr/rss/board.es?mid=a10503000000&bid=0027",
      enabled: true, weight: 9, presetSlugs: "policy,parenting",
    },
    {
      name: "고용노동부 정책자료", sourceId: "moel_policy",
      type: "rss", url: "https://www.moel.go.kr/rss/policy.do",
      enabled: true, weight: 9, presetSlugs: "policy,parenting",
    },
    {
      name: "기획재정부 보도자료", sourceId: "moef_press",
      type: "html", url: "https://mofe.go.kr/nw/nes/nesdta.do?menuNo=4010100",
      enabled: false, weight: 8, presetSlugs: "policy,finance",
    },
    {
      name: "국토교통부 보도자료", sourceId: "molit_press",
      type: "html", url: "https://www.molit.go.kr/USR/NEWS/m_71/lst.jsp",
      enabled: false, weight: 8, presetSlugs: "housing",
    },

    // ─── 언론사 · 경제 종합 (정책/제도, 금융 공통) ───────────────────────
    {
      name: "매일경제 경제", sourceId: "mk_economy",
      type: "rss", url: "https://www.mk.co.kr/rss/30100041/",
      enabled: true, weight: 6, presetSlugs: "policy,finance",
    },
    {
      name: "한국경제 경제", sourceId: "hk_economy",
      type: "rss", url: "https://www.hankyung.com/feed/economy",
      enabled: true, weight: 6, presetSlugs: "policy,finance",
    },
    {
      name: "동아일보 경제", sourceId: "donga_economy",
      type: "rss", url: "https://rss.donga.com/economy.xml",
      enabled: true, weight: 6, presetSlugs: "policy,finance",
    },

    // ─── 언론사 · 금융 전문 ───────────────────────────────────────────────
    {
      name: "한국경제 금융", sourceId: "hk_finance",
      type: "rss", url: "https://www.hankyung.com/feed/finance",
      enabled: true, weight: 7, presetSlugs: "finance",
    },
    {
      name: "매일경제 증권·금융", sourceId: "mk_finance",
      type: "rss", url: "https://www.mk.co.kr/rss/40300001/",
      enabled: true, weight: 6, presetSlugs: "finance",
    },

    // ─── 언론사 · 부동산 전문 ─────────────────────────────────────────────
    {
      name: "한국경제 부동산", sourceId: "hk_realestate",
      type: "rss", url: "https://www.hankyung.com/feed/realestate",
      enabled: true, weight: 7, presetSlugs: "housing",
    },
    {
      name: "매일경제 부동산", sourceId: "mk_realestate",
      type: "rss", url: "https://www.mk.co.kr/rss/50300009/",
      enabled: true, weight: 7, presetSlugs: "housing",
    },
    {
      name: "동아일보 부동산", sourceId: "donga_realestate",
      type: "rss", url: "https://rss.donga.com/realestate.xml",
      enabled: true, weight: 6, presetSlugs: "housing",
    },

    // ─── 언론사 · 사회 (육아/교육 관련) ──────────────────────────────────
    {
      name: "동아일보 사회", sourceId: "donga_society",
      type: "rss", url: "https://rss.donga.com/society.xml",
      enabled: true, weight: 5, presetSlugs: "parenting",
    },
    {
      name: "한국경제 사회", sourceId: "hk_society",
      type: "rss", url: "https://www.hankyung.com/feed/society",
      enabled: true, weight: 5, presetSlugs: "parenting",
    },
  ];

  for (const s of sources) {
    await prisma.source.upsert({
      where: { sourceId: s.sourceId },
      update: s,
      create: s,
    });
  }
  console.log("Seeded sources:", sources.length);
}

const PRESETS = [
  {
    slug: "policy",
    name: "제도·지원·세제",
    description: "제도 변경, 지원 확대, 세제 변경 중심",
    defaultAiTopN: 20,
    keywords: {
      change: {
        "개편": 6, "신설": 6, "확대": 6, "상향": 6, "인하": 6, "완화": 6, "강화": 6,
        "변경": 5, "개정": 6, "시행": 6, "적용": 5, "연장": 5, "폐지": 6, "전환": 4, "통합": 4,
      },
      life: {
        "지원": 5, "지급": 6, "급여": 6, "수당": 6, "바우처": 6, "보조금": 6,
        "세액공제": 7, "소득공제": 7, "감면": 7, "과세": 7, "비과세": 7,
        "보험료": 6, "건강보험": 6, "국민연금": 5, "대출": 5, "금리": 5, "한도": 5,
        "기준": 5, "자격": 5, "요건": 5, "신청": 5, "대상": 4, "의무": 4, "면제": 5,
      },
      noise: {
        "개최": -12, "기념식": -12, "캠페인": -10, "행사": -10, "간담회": -10, "토론회": -10,
        "시상": -10, "인터뷰": -8, "논란": -12, "충격": -12, "사건": -12, "사고": -12,
        "연예": -20, "스포츠": -20,
      },
    },
  },
  {
    slug: "finance",
    name: "금융·가계",
    description: "금리/대출/카드/수수료/예금 등 가계 금융 영향",
    defaultAiTopN: 20,
    keywords: {
      change: { "변경": 5, "개정": 6, "시행": 6, "확대": 6, "인하": 6, "상향": 6, "완화": 6, "연장": 5 },
      life: {
        "금리": 7, "대출": 7, "전세": 6, "주담대": 7, "신용": 6, "카드": 6, "수수료": 7,
        "예금": 6, "적금": 6, "대환": 7, "DSR": 7, "LTV": 7, "한도": 6, "연체": 6, "이자": 7,
      },
      noise: { "연예": -20, "스포츠": -20, "사건": -12, "사고": -12, "논란": -12, "개최": -10, "캠페인": -10 },
    },
  },
  {
    slug: "housing",
    name: "부동산·주거",
    description: "청약/임대/전월세/재건축/공급 등 주거 정책",
    defaultAiTopN: 20,
    keywords: {
      change: { "개편": 6, "변경": 5, "개정": 6, "시행": 6, "확대": 6, "완화": 6, "강화": 6, "인하": 6, "상향": 6 },
      life: {
        "청약": 8, "전세": 7, "월세": 7, "임대": 7, "분양": 7, "재건축": 7, "재개발": 7,
        "공급": 6, "주택": 6, "대출": 5, "보증": 6, "전월세": 7, "전세사기": 7,
      },
      noise: { "연예": -20, "스포츠": -20, "사건": -12, "사고": -12, "논란": -12, "개최": -10, "캠페인": -10 },
    },
  },
  {
    slug: "parenting",
    name: "육아·교육",
    description: "수당/돌봄/보육/교육비 등 가족 체감 이슈",
    defaultAiTopN: 20,
    keywords: {
      change: { "신설": 6, "확대": 6, "상향": 6, "인하": 6, "완화": 6, "변경": 5, "개정": 6, "시행": 6, "연장": 5 },
      life: {
        "육아": 8, "출산": 8, "보육": 7, "어린이집": 7, "유치원": 7, "돌봄": 7,
        "수당": 8, "급여": 6, "바우처": 7, "지원": 6, "교육비": 7, "학자금": 6,
      },
      noise: { "연예": -20, "스포츠": -20, "사건": -12, "사고": -12, "논란": -12, "개최": -10, "캠페인": -10 },
    },
  },
];

async function upsertPresets() {
  for (const p of PRESETS) {
    const preset = await prisma.topicPreset.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description, enabled: true, defaultAiTopN: p.defaultAiTopN },
      create: { slug: p.slug, name: p.name, description: p.description, enabled: true, defaultAiTopN: p.defaultAiTopN },
    });

    for (const [group, dict] of Object.entries(p.keywords)) {
      for (const [keyword, weight] of Object.entries(dict)) {
        await prisma.topicKeyword.upsert({
          where: { presetId_group_keyword: { presetId: preset.id, group, keyword } },
          update: { weight: Number(weight) },
          create: { presetId: preset.id, group, keyword, weight: Number(weight) },
        });
      }
    }
  }

  const first = await prisma.topicPreset.findFirst({ where: { slug: "policy" } });
  await prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: { activePresetId: first?.id ?? null },
    create: { id: "singleton", activePresetId: first?.id ?? null },
  });

  console.log("Seeded presets:", PRESETS.length);
}

async function main() {
  await upsertSources();
  await upsertPresets();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
