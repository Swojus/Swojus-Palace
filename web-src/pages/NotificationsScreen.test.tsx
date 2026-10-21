import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationsScreen } from "./NotificationsScreen";
import apiFetch from "../utils/api";

vi.mock("../MuhurtContext", () => ({
  useMuhurt: () => ({ todayMuhurtDates: [] }),
}));

vi.mock("../utils/api", () => ({
  default: vi.fn(),
}));

describe("NotificationsScreen", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });
    vi.mocked(apiFetch).mockResolvedValue({
      json: async () => [],
    } as Response);
  });

  it("shows notifications received while the screen is open", async () => {
    render(<NotificationsScreen />);

    expect(await screen.findByText("No notifications for today")).toBeVisible();

    window.localStorage.setItem(
      "eventflow/notifications",
      JSON.stringify([
        {
          id: "notification-1",
          action: "created",
          eventName: "New event",
          actorName: "Manager One",
          createdAt: new Date().toISOString(),
        },
      ]),
    );
    window.dispatchEvent(
      new CustomEvent("eventflow:notifications-updated"),
    );

    expect(await screen.findByText(/New event • By Manager One/)).toBeVisible();
  });
});
