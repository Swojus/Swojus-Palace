import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

import { EventFormScreen } from "./EventFormScreen";
import apiFetch from "../utils/api";

vi.mock("../MuhurtContext", () => ({
  useMuhurt: () => ({ muhurtDates: [] }),
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ isAdmin: true }),
}));

vi.mock("../utils/api", () => ({
  default: vi.fn(),
}));

vi.mock("../../src/data/notificationLog", () => ({
  addStoredNotification: vi.fn(),
}));

vi.mock("../../src/data/mock", () => ({
  getDefaultInventory: () => [],
  mockRecords: [],
  saveMockRecord: vi.fn(),
}));

describe("EventFormScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/events?date=2025-07-15");

    vi.mocked(apiFetch).mockResolvedValue({
      json: async () => [
        {
          id: "existing-booking",
          eventSource: "Booking",
          eventDate: "2025-07-15",
          title: "Existing booking",
          customerName: "Test Customer",
          phone: "9876543210",
          altPhone: "",
          venue: "Main Hall",
          rooms: ["Hall A"],
          eventType: "Wedding",
          inventory: [],
        },
      ],
    } as any);
  });

  it("defaults a new event form to Enquiry source", () => {
    render(
      <MemoryRouter initialEntries={["/events?date=2025-07-15"]}>
        <EventFormScreen />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /enquiry/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /booking/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("allows creating another booking on a date that already has an event and shows a note", async () => {
    render(
      <MemoryRouter initialEntries={["/events?date=2025-07-15"]}>
        <EventFormScreen />
      </MemoryRouter>,
    );

    const createButton = await screen.findByRole("button", { name: /create/i });

    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });

    expect(
      screen.getByText(
        /This date already has 1 booked event\. You can still add another event\./i,
      ),
    ).toBeInTheDocument();
  });
});
