import { Card, CardBody, CardHeader } from "@/src/ui/Card";
import { SourcesClient } from "@/app/_components/SourcesClient";

export default function SourcesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white/90">Sources</h1>
        <p className="text-xs text-white/35 mt-1">RSS/HTML 뉴스 소스 관리 · enable 토글 · 가중치 조정</p>
      </div>

      <Card>
        <CardBody className="py-2">
          <SourcesClient />
        </CardBody>
      </Card>
    </div>
  );
}
