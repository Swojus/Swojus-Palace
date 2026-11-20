import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MuhurtProvider, useMuhurt } from "./MuhurtContext";
import apiFetch from "./utils/api";

vi.mock("./utils/api", () => ({
  default: vi.fn(),
}));

function MuhurtTestConsumer() {
  const { addMuhurtDate, muhurtDates, refreshMuhurtDates } = useMuhurt();

  return (
    <>
      <button onClick={refreshMuhurtDates}>Refresh Muhurt</button>
      <button
        onClick={() =>
          addMuhurtDate({
            date: "2026-11-20",
            description: "Sub muhurta",
            type: "Sub Muhurt",
          })
        }
      >
        Add Muhurt
      </button>
      <span>{muhurtDates[0]?.type}</span>
    </>
  );
}

describe("MuhurtProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockImplementation(async (_input, init) => {
      if (init?.method === "GET") {
        return {
          ok: true,
          json: async () => [
            {
              _id: "muhurt-1",
              date: "2026-11-20",
              description: "Sub muhurta",
              type: "Sub Muhurt",
            },
          ],
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          _id: "muhurt-1",
          date: "2026-11-20",
          description: "Sub muhurta",
          type: "Sub Muhurt",
        }),
      } as Response;
    });
  });

  it("loads saved Muhurt dates from the GET service", async () => {
    render(
      <MuhurtProvider>
        <MuhurtTestConsumer />
      </MuhurtProvider>,
    );

    expect(await screen.findByText("Sub Muhurt")).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith("/api/muhurt", { method: "GET" });
  });

  it("persists and displays the selected Muhurt type", async () => {
    render(
      <MuhurtProvider>
        <MuhurtTestConsumer />
      </MuhurtProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Muhurt" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/muhurt",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            date: "2026-11-20",
            description: "Sub muhurta",
            type: "Sub Muhurt",
          }),
        }),
      );
      expect(screen.getByText("Sub Muhurt")).toBeInTheDocument();
    });
  });

  it("can refresh saved Muhurt dates from the GET service", async () => {
    render(
      <MuhurtProvider>
        <MuhurtTestConsumer />
      </MuhurtProvider>,
    );

    await screen.findByText("Sub Muhurt");
    fireEvent.click(screen.getByRole("button", { name: "Refresh Muhurt" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledTimes(2);
    });
  });
});
