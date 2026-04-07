import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ReminderStatusBadge } from "../reminder-status-badge"

describe("ReminderStatusBadge", () => {
  it("pending 상태일 때 '대기중' 텍스트를 렌더링한다", () => {
    render(<ReminderStatusBadge status="pending" />)
    expect(screen.getByText("대기중")).toBeInTheDocument()
  })

  it("sent 상태일 때 '발송됨' 텍스트를 렌더링한다", () => {
    render(<ReminderStatusBadge status="sent" />)
    expect(screen.getByText("발송됨")).toBeInTheDocument()
  })

  it("failed 상태일 때 '실패' 텍스트를 렌더링한다", () => {
    render(<ReminderStatusBadge status="failed" />)
    expect(screen.getByText("실패")).toBeInTheDocument()
  })

  it("pending 상태에 노란색 스타일 클래스를 적용한다", () => {
    render(<ReminderStatusBadge status="pending" />)
    const badge = screen.getByText("대기중")
    expect(badge).toHaveClass("bg-yellow-100", "text-yellow-800")
  })

  it("sent 상태에 초록색 스타일 클래스를 적용한다", () => {
    render(<ReminderStatusBadge status="sent" />)
    const badge = screen.getByText("발송됨")
    expect(badge).toHaveClass("bg-green-100", "text-green-800")
  })

  it("failed 상태에 빨간색 스타일 클래스를 적용한다", () => {
    render(<ReminderStatusBadge status="failed" />)
    const badge = screen.getByText("실패")
    expect(badge).toHaveClass("bg-red-100", "text-red-800")
  })

  it("className prop을 추가로 적용한다", () => {
    render(<ReminderStatusBadge status="pending" className="custom-class" />)
    const badge = screen.getByText("대기중")
    expect(badge).toHaveClass("custom-class")
  })
})
