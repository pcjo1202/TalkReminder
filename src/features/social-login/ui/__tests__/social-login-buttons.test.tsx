import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialLoginButtons } from "../social-login-buttons";
import { authClient } from "@/shared/lib/auth-client";

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SocialLoginButtons", () => {
  it("카카오, Google, GitHub 로그인 버튼을 렌더링한다", () => {
    render(<SocialLoginButtons />);
    expect(
      screen.getByRole("button", { name: /카카오로 계속하기/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Google로 계속하기/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /GitHub로 계속하기/i })
    ).toBeInTheDocument();
  });

  it("카카오 버튼 클릭 시 signIn.social을 kakao provider로 호출한다", async () => {
    const user = userEvent.setup();
    render(<SocialLoginButtons />);

    const kakaoButton = screen.getByRole("button", {
      name: /카카오로 계속하기/i,
    });
    await user.click(kakaoButton);

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "kakao",
      callbackURL: "/dashboard",
    });
  });

  it("카카오 버튼 클릭 시 커스텀 callbackUrl을 전달한다", async () => {
    const user = userEvent.setup();
    render(<SocialLoginButtons callbackUrl="/settings" />);

    const kakaoButton = screen.getByRole("button", {
      name: /카카오로 계속하기/i,
    });
    await user.click(kakaoButton);

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "kakao",
      callbackURL: "/settings",
    });
  });
});
