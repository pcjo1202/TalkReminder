import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SocialLoginButtons } from "../social-login-buttons";

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}));

afterEach(() => {
  cleanup();
});

describe("SocialLoginButtons", () => {
  it("renders Google and GitHub login buttons", () => {
    render(<SocialLoginButtons />);
    expect(
      screen.getByRole("button", { name: /Google로 계속하기/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /GitHub로 계속하기/i })
    ).toBeInTheDocument();
  });
});
