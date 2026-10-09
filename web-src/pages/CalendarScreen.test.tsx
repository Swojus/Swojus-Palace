import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

import { CalendarScreen } from "./CalendarScreen";
import apiFetch from "../utils/api";

vi.mock("../MuhurtContext", () => ({
  useMuhurt: () => ({
    muhurtDates: [{ date: "2026-10-15", description: "Auspicious Muhurt" }],
  }),
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ isAdmin: true }),
}));

vi.mock("../utils/api", () => ({
  default: vi.fn(),
}));

describe("CalendarScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockResolvedValue({
      json: async () => [
        { id: "event-1", eventDate: "2026-10-15", title: "Wedding 1" },
        { id: "event-2", eventDate: "2026-10-15", title: "Wedding 2" },
      ],
    } as any);
  });

  it("shows the exact count for multiple events on the same date and keeps the add button visible", async () => {
    render(
      <MemoryRouter>
        <CalendarScreen />
      </MemoryRouter>,
    );

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("Auspicious Muhurt")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Add event for Oct 15, 2026"),
    ).toBeInTheDocument();
  });
});
