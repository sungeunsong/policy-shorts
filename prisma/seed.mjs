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

    // ─── 언론사 · 사회·육아 공통 ─────────────────────────────────────────
    {
      name: "동아일보 건강", sourceId: "donga_health",
      type: "rss", url: "https://rss.donga.com/health.xml",
      enabled: true, weight: 5, presetSlugs: "parenting",
    },
    {
      name: "동아일보 사회", sourceId: "donga_national",
      type: "rss", url: "https://rss.donga.com/national.xml",
      enabled: true, weight: 7, presetSlugs: "parenting,society",
    },
    {
      name: "동아일보 여성", sourceId: "donga_woman",
      type: "rss", url: "https://rss.donga.com/woman.xml",
      enabled: true, weight: 6, presetSlugs: "parenting",
    },
    {
      name: "한겨레 종합", sourceId: "hani_all",
      type: "rss", url: "https://www.hani.co.kr/rss/",
      enabled: true, weight: 7, presetSlugs: "parenting,society",
    },

    // ─── 사회·사건사고 전용 ──────────────────────────────────────────────
    {
      name: "연합뉴스 속보", sourceId: "yna_briefing",
      type: "rss", url: "https://www.yonhapnews.co.kr/rss/briefing.xml",
      enabled: true, weight: 9, presetSlugs: "society",
    },
    {
      name: "연합뉴스 사회", sourceId: "yna_society",
      type: "rss", url: "https://www.yonhapnews.co.kr/rss/socialscience.xml",
      enabled: true, weight: 8, presetSlugs: "society",
    },
    {
      name: "조선일보 사회", sourceId: "chosun_national",
      type: "rss", url: "https://www.chosun.com/arc/outboundfeeds/rss/category/national/",
      enabled: true, weight: 7, presetSlugs: "society",
    },
    {
      name: "중앙일보 사회", sourceId: "joongang_society",
      type: "rss", url: "https://rss.joins.com/joins_news_rss.xml",
      enabled: true, weight: 7, presetSlugs: "society",
    },
    {
      name: "MBC 뉴스 사회", sourceId: "mbc_society",
      type: "rss", url: "https://imnews.imbc.com/rss/news/news_00.xml",
      enabled: true, weight: 7, presetSlugs: "society",
    },

    // ─── 연예 핫 이슈 ─────────────────────────────────────────────────────
    {
      name: "동아일보 연예", sourceId: "donga_entertainment",
      type: "rss", url: "https://rss.donga.com/entertainment.xml",
      enabled: true, weight: 8, presetSlugs: "entertainment",
    },
    {
      name: "매일경제 연예", sourceId: "mk_entertainment",
      type: "rss", url: "https://www.mk.co.kr/rss/30200036/",
      enabled: true, weight: 7, presetSlugs: "entertainment",
    },
    {
      name: "한국경제 연예", sourceId: "hk_entertainment",
      type: "rss", url: "https://www.hankyung.com/feed/entertainment",
      enabled: true, weight: 7, presetSlugs: "entertainment",
    },
    {
      name: "조선일보 연예", sourceId: "chosun_entertainment",
      type: "rss", url: "https://www.chosun.com/arc/outboundfeeds/rss/category/entertainments/",
      enabled: true, weight: 7, presetSlugs: "entertainment",
    },
    {
      name: "중앙일보 연예", sourceId: "joongang_entertainment",
      type: "rss", url: "https://rss.joins.com/joins_life_rss.xml",
      enabled: true, weight: 7, presetSlugs: "entertainment",
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
  {
    slug: "society",
    name: "사회·사건사고",
    description: "사건/사고/수사/판결 등 사회 핫 이슈",
    defaultAiTopN: 20,
    keywords: {
      change: {
        // 사건 발생·수사·판결 신호
        "발생": 7, "적발": 8, "구속": 8, "검거": 7, "체포": 7, "수사": 6,
        "기소": 7, "판결": 7, "선고": 7, "폭발": 8, "화재": 7, "붕괴": 8,
        "충돌": 6, "사망": 6, "추락": 7, "유출": 6, "논란": 5, "충격": 5,
      },
      life: {
        // 관련 기관·분류
        "경찰": 5, "검찰": 5, "법원": 5, "소방": 5,
        "마약": 6, "음주": 5, "사기": 6, "불법": 5, "범죄": 5,
        "피해": 5, "학교": 4, "병원": 4, "도로": 4, "군": 4,
      },
      noise: {
        // 정치·경제·연예 노이즈
        "정책": -8, "법안": -10, "예산": -10, "금리": -10, "부동산": -10,
        "청약": -10, "연예": -10, "스포츠": -10, "개최": -8, "캠페인": -8,
      },
    },
  },
  {
    slug: "entertainment",
    name: "연예 핫 이슈",
    description: "화제·흥행·컴백·시청률 등 연예 핫 이슈",
    defaultAiTopN: 20,
    keywords: {
      change: {
        // 화제성 · 트렌드 신호
        "화제": 8, "열풍": 7, "역주행": 8, "흥행": 7, "대박": 6, "인기": 5,
        "1위": 8, "컴백": 6, "데뷔": 5, "발표": 4, "공개": 5, "개봉": 6, "방영": 5,
        "출연": 4, "선정": 5, "돌풍": 7, "화제작": 6,
      },
      life: {
        // 연예 카테고리 · 장르
        "드라마": 6, "예능": 5, "아이돌": 5, "K팝": 5, "케이팝": 5,
        "뮤직비디오": 5, "앨범": 5, "콘서트": 5, "팬미팅": 4,
        "영화": 5, "시청률": 7, "스트리밍": 5, "OST": 5,
        "배우": 4, "가수": 4, "그룹": 4, "아티스트": 4,
        "OTT": 5, "넷플릭스": 5, "시즌": 4,
      },
      noise: {
        // 정책·정치·경제 노이즈 제거
        "정책": -15, "법안": -15, "예산": -15, "국회": -12, "정부": -10,
        "대통령": -12, "선거": -12, "세금": -10, "금리": -10, "부동산": -10,
        "청약": -10, "보험료": -10,
      },
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
