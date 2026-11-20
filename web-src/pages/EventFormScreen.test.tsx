import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

import { EventFormScreen } from "./EventFormScreen";
import apiFetch from "../utils/api";

const mockAuth = vi.hoisted(() => ({
  user: null as
    | { id: string; email: string; roleId: number; name?: string }
    | null,
  isAdmin: true,
}));

vi.mock("../MuhurtContext", () => ({
  useMuhurt: () => ({ muhurtDates: [] }),
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ ...mockAuth, loading: false }),
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
    mockAuth.user = { id: "admin", email: "admin@example.com", roleId: 1 };
    mockAuth.isAdmin = true;
    window.history.pushState({}, "", "/events?date=2025-07-15");

    vi.mocked(apiFetch).mockResolvedValue({
      json: async () => [
        {
          id: "existing-booking",
          eventSource: "Booking",
          eventDate: "2025-07-15",
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

  it("selects Booking immediately when opening an enquiry conversion form", async () => {
    let resolveEvents!: (response: Response) => void;
    vi.mocked(apiFetch).mockReturnValue(
      new Promise((resolve) => {
        resolveEvents = resolve;
      }),
    );

    render(
      <MemoryRouter
        initialEntries={[
          "/events/new?enquiryId=enquiry-1&asEdit=1",
        ]}
      >
        <EventFormScreen />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /booking/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /enquiry/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    resolveEvents({
      json: async () => [
        {
          id: "enquiry-1",
          eventSource: "Enquiry",
          customerName: "Test Customer",
        },
      ],
    } as Response);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /booking/i })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
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

  it("lets a manager add rooms without changing existing rooms or event details", async () => {
    const booking = {
      id: "booking-1",
      _id: "booking-1",
      eventSource: "Booking",
      eventDate: "2025-07-15",
      customerName: "Test Customer",
      phone: "9876543210",
      venue: "PADMA",
      rooms: ["Phase 1-101"],
      eventType: "Wedding",
      inventory: [],
    };
    mockAuth.user = {
      id: "manager",
      email: "manager@example.com",
      roleId: 2,
    };
    mockAuth.isAdmin = false;
    vi.mocked(apiFetch).mockImplementation(async (input) =>
      ({
        ok: true,
        json: async () => (String(input) === "/api/events" ? [booking] : booking),
      }) as Response,
    );

    render(
      <MemoryRouter initialEntries={["/events/booking-1/edit"]}>
        <Routes>
          <Route
            path="/events/:eventId/edit"
            element={<EventFormScreen mode="edit" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const roomInput = await screen.findByRole("textbox", { name: "Rooms *" });
    expect(
      screen.getByRole("combobox", { name: /event type/i }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    fireEvent.click(roomInput);

    const roomCheckboxes = await screen.findAllByRole("checkbox");
    expect(roomCheckboxes[1]).toBeDisabled();
    expect(roomCheckboxes[2]).not.toBeDisabled();
    fireEvent.click(roomCheckboxes[2]);
    fireEvent.click(await screen.findByText("Save Rooms"));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/events/booking-1/rooms",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            rooms: ["Phase 1-101", "Phase 1-102"],
          }),
        }),
      );
    });
  });

  it("shows a saved event in read-only mode", async () => {
    const booking = {
      id: "booking-1",
      _id: "booking-1",
      eventSource: "Booking",
      eventDate: "2025-07-15",
      customerName: "Test Customer",
      phone: "9876543210",
      venue: "PADMA",
      rooms: ["Phase 1-101"],
      eventType: "Wedding",
      inventory: [],
    };
    vi.mocked(apiFetch).mockImplementation(async (input) =>
      ({
        ok: true,
        json: async () => (String(input) === "/api/events" ? [booking] : booking),
      }) as Response,
    );

    render(
      <MemoryRouter initialEntries={["/events/booking-1/view"]}>
        <Routes>
          <Route
            path="/events/:eventId/view"
            element={<EventFormScreen mode="view" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("combobox", { name: /event type/i }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create|update|save rooms/i }),
    ).not.toBeInTheDocument();
  });
});
