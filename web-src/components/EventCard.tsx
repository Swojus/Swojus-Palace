import React from "react";
import { RecordItem } from "../../src/types";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  MessageCircle,
  Bookmark,
  Users,
  SquarePen,
  LogIn,
  LogOut,
  ChevronRight,
  Trash2,
  Plus,
} from "lucide-react";

type EventCardProps = {
  event: RecordItem;
  mode?: "booked" | "completed";
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onConvert?: () => void;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
};

export function EventCard({
  event,
  mode = "booked",
  onClick,
  onEdit,
  onDelete,
  onConvert,
  onCheckIn,
  onCheckOut,
}: EventCardProps) {
  const isCompleted = mode === "completed";
  const isBookedEvent = event.eventSource === "Booking";
  const isEnquiryEvent = event.eventSource === "Enquiry";
  const canManageBooking = !isCompleted && isBookedEvent;
  const canManageEnquiry = !isCompleted && isEnquiryEvent;
  const formatDisplayDate = (value: string | null | undefined) => {
    if (!value) return "";

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      const day = String(parsedDate.getDate()).padStart(2, "0");
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const year = parsedDate.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return value;
  };
  const displayDate = formatDisplayDate(event.eventDate);
  const normalizedPhone = (event.phone ?? "")
    .replace(/\s+/g, "")
    .replace(/[^\d+]/g, "");
  const phoneHref = normalizedPhone ? `tel:${normalizedPhone}` : "";
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone.replace(/^\+/, "")}`
    : "";
  const missingCount = (event.inventory ?? []).reduce(
    (sum, item) => sum + Math.max(0, item.issuedQty - item.returnedQty),
    0,
  );
  const hasMissing = missingCount > 0;
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const isInventoryCard = isCompleted && Boolean(onClick);

  return (
    <article
      className="card event-card"
      style={{
        border: isInventoryCard
          ? isHovered
            ? "1px solid rgba(99, 102, 241, 0.3)"
            : "1px solid rgba(99, 102, 241, 0.22)"
          : undefined,
        boxShadow: isInventoryCard
          ? isHovered
            ? "0 0 0 1px rgba(180, 35, 24, 0.08), 0 10px 24px rgba(29, 78, 216, 0.12)"
            : "0 0 0 1px rgba(99, 102, 241, 0.08), 0 7px 20px rgba(39, 48, 66, 0.06)"
          : undefined,
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      }}
    >
      <style>{`
        @keyframes badgePulse {
          0%, 100% {
            box-shadow: 0 1px 2px rgba(15, 122, 79, 0.12);
          }
          50% {
            box-shadow: 0 4px 12px rgba(15, 122, 79, 0.18);
          }
        }
      `}</style>
      <div className="event-top">
        <div className="tile-icon">
          <CalendarDays size={14} />
        </div>
        <div className="event-head-copy">
          <h3>{event.customerName ?? event.name}</h3>
          <span className="date-pill">
            <Clock3 size={14} />
            {displayDate}
          </span>
        </div>
      </div>

      <div className="meta-list">
        {event.phone && (
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
                aria-label={`Call ${event.phone}`}
              >
                {event.phone}
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
                aria-label={`WhatsApp ${event.phone}`}
                title={`WhatsApp ${event.phone}`}
              >
                <MessageCircle size={14} />
              </a>
            )}
          </p>
        )}
        <p>
          <MapPin size={16} />
          {event.venue}
        </p>
        <p>
          <Bookmark size={16} />
          {event.title}
        </p>
        {Array.isArray(event.rooms) && event.rooms.length > 0 ? (
          <p>
            <Users size={16} />
            {event.rooms.length} rooms
          </p>
        ) : null}
      </div>

      {isCompleted && onClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            marginTop: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.55rem",
            padding: "0.5rem 0.9rem",
            borderRadius: "999px",
            background: isHovered
              ? "linear-gradient(135deg, rgba(219, 234, 254, 1), rgba(255, 231, 228, 1))"
              : "linear-gradient(135deg, rgba(232, 240, 255, 1), rgba(255, 242, 242, 1))",
            color: "#1d4ed8",
            fontWeight: 900,
            fontSize: "0.85rem",
            letterSpacing: "0.02em",
            border: "1px solid rgba(29, 78, 216, 0.2)",
            boxShadow: isHovered
              ? "0 3px 10px rgba(29, 78, 216, 0.14), 0 0 0 1px rgba(180, 35, 24, 0.08)"
              : "0 1px 2px rgba(29, 78, 216, 0.08)",
            transform: isHovered ? "translateY(-1px)" : "translateY(0)",
            transition:
              "transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease, border-color 150ms ease",
            animation: isHovered
              ? "badgePulse 700ms ease-in-out infinite"
              : "none",
            cursor: "pointer",
            outline: isFocused ? "2px solid rgba(25, 118, 210, 0.28)" : "none",
            outlineOffset: 2,
          }}
        >
          <ChevronRight size={14} />
          View inventory
          {hasMissing ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
                minWidth: "1.3rem",
                height: "1.3rem",
                padding: "0 0.45rem",
                borderRadius: "999px",
                background: "#b42318",
                color: "#fff",
                fontSize: "0.72rem",
                fontWeight: 900,
                lineHeight: 1,
                boxShadow: "0 1px 3px rgba(180, 35, 24, 0.24)",
              }}
            >
              <span
                style={{
                  width: "0.35rem",
                  height: "0.35rem",
                  borderRadius: "999px",
                  background: "#fff",
                  display: "inline-block",
                }}
              />
              {missingCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {canManageBooking && (
        <div className="event-actions">
          {onEdit && (
            <button
              type="button"
              className="btn-icon btn-edit"
              aria-label="Edit event"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <SquarePen size={18} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="btn-icon btn-delete"
              aria-label="Delete event"
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
            aria-label="Check in"
            onClick={(e) => {
              e.stopPropagation();
              onCheckIn?.();
            }}
          >
            <LogIn size={18} />
          </button>
          {(event.inventory ?? []).some((item) => item.issuedQty > 0) ? (
            <button
              type="button"
              className="btn-icon btn-complete"
              aria-label="Check out"
              onClick={(e) => {
                e.stopPropagation();
                onCheckOut?.();
              }}
            >
              <LogOut size={18} />
            </button>
          ) : null}
        </div>
      )}

      {canManageEnquiry && (
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
          {onConvert && (
            <button
              type="button"
              className="btn-icon btn-assign"
              aria-label="Convert enquiry"
              title="Convert enquiry"
              onClick={(e) => {
                e.stopPropagation();
                onConvert();
              }}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
