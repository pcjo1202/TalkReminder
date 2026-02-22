import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HomePage from "../page";

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  it("renders the service name", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "Talk Reminder" })
    ).toBeInTheDocument();
  });

  it("renders the CTA button linking to /login", () => {
    render(<HomePage />);
    const cta = screen.getByRole("link", { name: /시작하기/i });
    expect(cta).toHaveAttribute("href", "/login");
  });

  it("renders 3 feature cards", () => {
    render(<HomePage />);
    expect(screen.getByText("채널 통합")).toBeInTheDocument();
    expect(screen.getByText("유연한 스케줄")).toBeInTheDocument();
    expect(screen.getByText("메시지 템플릿")).toBeInTheDocument();
  });
});
