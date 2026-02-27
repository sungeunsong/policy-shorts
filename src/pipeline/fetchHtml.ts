import type { NormalizedItem } from "./types";

/**
 * MVP: html 수집기는 사이트별 셀렉터가 필요해서 소스별로 구현해야 합니다.
 * 현재 프로젝트는 '스켈레톤'만 제공하며, seed에서 html 소스는 disabled 처리되어 있습니다.
 *
 * 바이브코딩 단계에서:
 * - src/sources/mofe.ts, src/sources/molit.ts 같은 파일로 분리 구현 권장
 */
export async function fetchHtml(_sourceId: string, _listUrl: string, _maxItems: number): Promise<NormalizedItem[]> {
  return [];
}
