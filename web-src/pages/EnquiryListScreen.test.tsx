import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnquiryListScreen } from "./EnquiryListScreen";
import apiFetch from "../utils/api";

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ isAdmin: true }),
}));

vi.mock("../utils/api", () => ({
  default: vi.fn(),
}));

vi.mock("../components/DateRangeFilter", () => ({
  default: () => null,
}));

describe("EnquiryListScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockResolvedValue({
      json: async () => [
        {
          id: "past-enquiry",
          eventSource: "Enquiry",
          eventDate: "2020-01-15",
          title: "Past event",
          customerName: "Past Customer",
          phone: "9876543210",
          venue: "Main Hall",
          rooms: [],
        },
      ],
    } as Response);
  });

  it("shows enquiries with event dates in the past", async () => {
    render(
      <MemoryRouter initialEntries={["/enquiries"]}>
        <EnquiryListScreen />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Past Customer")).toBeInTheDocument();
  });
});
