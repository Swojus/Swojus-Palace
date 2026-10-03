import React from "react";
import { RecordItem } from "../../src/types";
import {
  CalendarDays,
  Clock3,
  Phone,
  MessageCircle,
  MapPin,
  Bookmark,
  Users,
  Plus,
  Trash2,
} from "lucide-react";

type EnquiryCardProps = {
  enquiry: RecordItem;
  isConvertDisabled?: boolean;
  onConvert?: () => void;
  onDelete?: () => void;
};

export function EnquiryCard({
  enquiry,
  isConvertDisabled = false,
  onConvert,
  onDelete,
}: EnquiryCardProps) {
  const normalizedPhone = (enquiry.phone ?? "")
    .replace(/\s+/g, "")
    .replace(/[^\d+]/g, "");
  const phoneHref = normalizedPhone ? `tel:${normalizedPhone}` : "";
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone.replace(/^\+/, "")}`
    : "";

  return (
    <article className="card enquiry-card">
      <div className="event-top">
        <div className="tile-icon">
          <CalendarDays size={14} />
        </div>
        <div className="event-head-copy">
          <h3>{enquiry.customerName ?? enquiry.name}</h3>
          <span className="date-pill">
            <Clock3 size={14} />
            {enquiry.eventDate}
          </span>
        </div>
      </div>

      <div className="meta-list">
        {enquiry.phone && (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Phone size={16} />
              <a
                href={phoneHref}
                style={{
                  color: "#1d4ed8",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
                aria-label={`Call ${enquiry.phone}`}
              >
                {enquiry.phone}
              </a>
            </span>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "1.8rem",
                  height: "1.8rem",
                  borderRadius: "999px",
                  background: "#e7f9ee",
                  color: "#166534",
                  textDecoration: "none",
                  border: "1px solid rgba(22, 101, 52, 0.18)",
                  boxShadow: "0 1px 2px rgba(22, 101, 52, 0.08)",
                }}
                aria-label={`WhatsApp ${enquiry.phone}`}
                title={`WhatsApp ${enquiry.phone}`}
              >
                <MessageCircle size={14} />
              </a>
            )}
          </p>
        )}
        <p>
          <MapPin size={16} />
          {enquiry.venue}
        </p>
        <p>
          <Bookmark size={16} />
          {enquiry.title}
        </p>
        <p>
          <Users size={16} />
          {enquiry.rooms.length} rooms
        </p>
      </div>

      <div className="event-actions">
        {onDelete && (
          <button
            type="button"
            className="btn-icon btn-delete"
            aria-label="Delete enquiry"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={18} />
          </button>
        )}
        <button
          type="button"
          className="btn-icon btn-assign"
          aria-label="Convert enquiry"
          aria-disabled={isConvertDisabled}
          disabled={isConvertDisabled}
          title={
            isConvertDisabled
              ? "This enquiry date is already booked"
              : "Convert enquiry"
          }
          onClick={(e) => {
            e.stopPropagation();
            if (!isConvertDisabled) {
              onConvert?.();
            }
          }}
        >
          <Plus size={18} />
        </button>
      </div>
    </article>
  );
}
