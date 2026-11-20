import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MuhurtProvider } from "../MuhurtContext";
import { MuhurtScreen } from "./MuhurtScreen";
import apiFetch from "../utils/api";

vi.mock("../utils/api", () => ({
  default: vi.fn(),
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ isAdmin: true }),
}));

describe("MuhurtScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockImplementation(async (_input, init) => {
      if (init?.method === "GET") {
        return { ok: true, json: async () => [] } as Response;
      }

      const requestBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          _id: "muhurt-sub-1",
          ...requestBody,
          type: "Main Muhurt",
        }),
      } as Response;
    });
  });

  it("uses the selected Sub Muhurt type when an older service omits or changes it", async () => {
    render(
      <MuhurtProvider>
        <MuhurtScreen />
      </MuhurtProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "add muhurt" }));

    const dateInput = document.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    fireEvent.change(dateInput, {
      target: { value: "2026-12-10" },
    });
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Sub ceremony" },
    });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Muhurt Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Sub Muhurt" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Muhurt" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        "/api/muhurt",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            date: "2026-12-10",
            description: "Sub ceremony",
            type: "Sub Muhurt",
          }),
        }),
      );
      expect(screen.getByText("Sub Muhurt")).toBeInTheDocument();
    });
  });
});
