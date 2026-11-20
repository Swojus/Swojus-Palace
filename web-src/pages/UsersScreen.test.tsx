import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsersScreen } from "./UsersScreen";
import apiFetch from "../utils/api";

const mockIsAdmin = vi.hoisted(() => ({ value: true }));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({ isAdmin: mockIsAdmin.value }),
}));

vi.mock("../utils/api", () => ({
  default: vi.fn(),
}));

describe("UsersScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.value = true;
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          _id: "manager-1",
          email: "manager@example.com",
          name: "Test Manager",
          roleId: 2,
          isApproved: true,
        },
      ],
    } as Response);
  });

  it("allows an admin to confirm deletion of a manager", async () => {
    render(<UsersScreen />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Test Manager" }),
    );
    expect(await screen.findByText(/permanently delete/i)).toBeInTheDocument();

    vi.mocked(apiFetch).mockImplementation(async (input, init) => {
      if (init?.method === "DELETE") {
        return { ok: true, json: async () => ({ ok: true }) } as Response;
      }
      return {
        ok: true,
        json: async () => [
          {
            _id: "manager-1",
            email: "manager@example.com",
            name: "Test Manager",
            roleId: 2,
            isApproved: true,
          },
        ],
      } as Response;
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/api/users/manager-1", {
        method: "DELETE",
      });
      expect(screen.queryByText("Test Manager")).not.toBeInTheDocument();
    });
  });

  it("does not show delete actions to non-admin users", async () => {
    mockIsAdmin.value = false;
    render(<UsersScreen />);

    expect(await screen.findByText("Test Manager")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Test Manager" }),
    ).not.toBeInTheDocument();
  });
});
