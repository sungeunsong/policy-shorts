export type KeywordDict = {
  change: Record<string, number>;
  life: Record<string, number>;
  noise: Record<string, number>;
};

export const defaultKeywordDict: KeywordDict = {
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
};

export const ruleWeights = {
  title: 1.0,
  summary: 0.6,
  content: 0.3,
  govBonus: 4,
  econPressBonus: 1,
  synergyBonus: 4,
  promoCapMax: 10,
};
