import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { EnquiryCard } from "./EnquiryCard";

describe("EnquiryCard", () => {
  it("allows conversion even when the enquiry date already has bookings", () => {
    const onConvert = vi.fn();

    render(
      <EnquiryCard
        enquiry={{
          id: "enquiry-1",
          _id: "enquiry-1",
          title: "Wedding",
          customerName: "Test Customer",
          venue: "Main Hall",
          rooms: [],
          eventDate: "2026-11-01",
          eventSource: "Enquiry",
        }}
        onConvert={onConvert}
      />,
    );

    const convertButton = screen.getByRole("button", {
      name: "Convert enquiry",
    });
    expect(convertButton).toBeEnabled();

    fireEvent.click(convertButton);
    expect(onConvert).toHaveBeenCalledOnce();
  });
});
