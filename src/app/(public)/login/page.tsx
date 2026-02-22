import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SocialLoginButtons } from "@/features/social-login";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Talk Reminder</CardTitle>
          <p className="text-sm text-muted-foreground">
            계정으로 로그인하세요
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-center text-sm text-destructive">
              로그인에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          <SocialLoginButtons callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
