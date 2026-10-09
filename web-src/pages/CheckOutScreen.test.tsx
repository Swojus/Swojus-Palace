import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

import { CheckOutScreen } from "./CheckOutScreen";
import apiFetch from "../utils/api";

vi.mock("../utils/api", () => ({
  default: vi.fn(),
}));

describe("CheckOutScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockResolvedValue({
      json: async () => ({
        id: "event-1",
        title: "Wedding",
        customerName: "Test Customer",
        venue: "Main Hall",
        eventDate: "2099-12-31",
        inventory: [
          { id: "chair", name: "Chair", issuedQty: 5, returnedQty: 0 },
        ],
      }),
    } as any);
  });

  it("blocks checkout before the event date and shows a message", async () => {
    render(
      <MemoryRouter initialEntries={["/events/event-1/check-out"]}>
        <Routes>
          <Route
            path="/events/:eventId/check-out"
            element={<CheckOutScreen />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const completeButton = await screen.findByRole("button", {
      name: /complete check-out/i,
    });

    expect(completeButton).toBeDisabled();
    expect(
      await screen.findByText(
        /cannot complete checkout before the event date\./i,
      ),
    ).toBeInTheDocument();
  });
});
