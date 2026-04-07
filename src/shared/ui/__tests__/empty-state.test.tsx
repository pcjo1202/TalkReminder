import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, afterEach } from "vitest"
import { EmptyState } from "../empty-state"

afterEach(() => {
  cleanup()
})

describe("EmptyState", () => {
  it("title을 렌더링한다", () => {
    render(<EmptyState title="데이터 없음" />)
    expect(screen.getByText("데이터 없음")).toBeInTheDocument()
  })

  it("description을 렌더링한다", () => {
    render(<EmptyState title="데이터 없음" description="아직 항목이 없습니다." />)
    expect(screen.getByText("아직 항목이 없습니다.")).toBeInTheDocument()
  })

  it("description이 없으면 렌더링하지 않는다", () => {
    render(<EmptyState title="데이터 없음" />)
    expect(screen.queryByText(/아직/)).not.toBeInTheDocument()
    // data-slot="empty-state-description" 요소가 없어야 함
    const { container } = render(<EmptyState title="데이터 없음" />)
    expect(
      container.querySelector('[data-slot="empty-state-description"]')
    ).not.toBeInTheDocument()
  })

  it("icon을 렌더링한다", () => {
    render(
      <EmptyState
        title="데이터 없음"
        icon={<span data-testid="test-icon">아이콘</span>}
      />
    )
    expect(screen.getByTestId("test-icon")).toBeInTheDocument()
  })

  it("icon이 없으면 icon 영역을 렌더링하지 않는다", () => {
    const { container } = render(<EmptyState title="데이터 없음" />)
    expect(
      container.querySelector('[data-slot="empty-state-icon"]')
    ).not.toBeInTheDocument()
  })

  it("action을 렌더링한다", () => {
    render(
      <EmptyState
        title="데이터 없음"
        action={<button>추가하기</button>}
      />
    )
    expect(screen.getByRole("button", { name: "추가하기" })).toBeInTheDocument()
  })

  it("action이 없으면 action 영역을 렌더링하지 않는다", () => {
    const { container } = render(<EmptyState title="데이터 없음" />)
    expect(
      container.querySelector('[data-slot="empty-state-action"]')
    ).not.toBeInTheDocument()
  })

  it("default variant를 적용한다", () => {
    const { container } = render(<EmptyState title="데이터 없음" />)
    expect(container.firstChild).toHaveClass("py-16")
    expect(container.firstChild).toHaveAttribute("data-variant", "default")
  })

  it("compact variant를 적용한다", () => {
    const { container } = render(
      <EmptyState title="데이터 없음" variant="compact" />
    )
    expect(container.firstChild).toHaveClass("py-8")
    expect(container.firstChild).toHaveAttribute("data-variant", "compact")
  })

  it("className prop을 적용한다", () => {
    const { container } = render(
      <EmptyState title="데이터 없음" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("data-slot 속성을 갖는다", () => {
    const { container } = render(<EmptyState title="데이터 없음" />)
    expect(container.firstChild).toHaveAttribute("data-slot", "empty-state")
  })

  it("모든 props를 함께 렌더링한다", () => {
    const { container } = render(
      <EmptyState
        title="결과 없음"
        description="검색 결과가 없습니다."
        icon={<span data-testid="search-icon">검색</span>}
        action={<button>다시 검색</button>}
        variant="compact"
      />
    )
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument()
    expect(screen.getByTestId("search-icon")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "다시 검색" })).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute("data-variant", "compact")
  })
})
