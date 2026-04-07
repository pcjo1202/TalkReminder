import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ToggleChannelSwitch } from "../toggle-channel-switch"

vi.mock("../../actions/toggle-channel", () => ({
  toggleChannel: vi.fn().mockResolvedValue(undefined),
}))

import { toggleChannel } from "../../actions/toggle-channel"

describe("ToggleChannelSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initialEnabled=true 일 때 스위치가 켜진 상태로 렌더링된다", () => {
    render(<ToggleChannelSwitch channelId="ch-1" initialEnabled={true} />)
    const switchEl = screen.getByRole("switch")
    expect(switchEl).toHaveAttribute("aria-checked", "true")
  })

  it("initialEnabled=false 일 때 스위치가 꺼진 상태로 렌더링된다", () => {
    render(<ToggleChannelSwitch channelId="ch-1" initialEnabled={false} />)
    const switchEl = screen.getByRole("switch")
    expect(switchEl).toHaveAttribute("aria-checked", "false")
  })

  it("클릭 시 상태가 토글된다", async () => {
    render(<ToggleChannelSwitch channelId="ch-1" initialEnabled={false} />)
    const switchEl = screen.getByRole("switch")

    fireEvent.click(switchEl)

    await waitFor(() => {
      expect(switchEl).toHaveAttribute("aria-checked", "true")
    })
  })

  it("클릭 시 서버 액션을 호출한다", async () => {
    render(<ToggleChannelSwitch channelId="ch-1" initialEnabled={false} />)
    const switchEl = screen.getByRole("switch")

    fireEvent.click(switchEl)

    await waitFor(() => {
      expect(toggleChannel).toHaveBeenCalledWith("ch-1", true)
    })
  })

  it("서버 액션 실패 시 원래 상태로 복원된다", async () => {
    vi.mocked(toggleChannel).mockRejectedValueOnce(new Error("서버 오류"))

    render(<ToggleChannelSwitch channelId="ch-1" initialEnabled={false} />)
    const switchEl = screen.getByRole("switch")

    fireEvent.click(switchEl)

    await waitFor(() => {
      expect(switchEl).toHaveAttribute("aria-checked", "false")
    })
  })

  it("className prop을 적용한다", () => {
    render(
      <ToggleChannelSwitch
        channelId="ch-1"
        initialEnabled={false}
        className="custom-class"
      />
    )
    const switchEl = screen.getByRole("switch")
    expect(switchEl).toHaveClass("custom-class")
  })
})
