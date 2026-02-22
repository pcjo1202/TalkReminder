import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Bell, MessageSquare, Clock, ArrowRight } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "채널 통합",
    description: "Slack, 카카오톡을 한 곳에서 관리하세요.",
  },
  {
    icon: Clock,
    title: "유연한 스케줄",
    description: "매주 월·수·금 오전 9시, 매월 마지막 금요일 등 세밀한 반복 설정.",
  },
  {
    icon: Bell,
    title: "메시지 템플릿",
    description: "변수를 활용한 재사용 가능한 메시지 템플릿.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-12 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Talk Reminder
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Slack과 카카오톡으로 유연한 반복 알람을 보내는 통합 알람 관리 서비스
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/login">
            시작하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid max-w-2xl gap-6 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-2 text-center"
          >
            <feature.icon className="h-8 w-8 text-primary" />
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
