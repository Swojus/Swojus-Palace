import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { mockRecords, saveMockRecordUpdate } from "../../src/data/mock";
import apiFetch from "../utils/api";
import { addStoredNotification } from "../../src/data/notificationLog";
import {
  ArrowLeft,
  BedSingle,
  Minus,
  Plus,
  LogOut,
  Shirt,
  UtensilsCrossed,
  Square,
  Check,
  AlertCircle,
} from "lucide-react";
import "../styles/modules/_material-muhurt.css";

type CheckoutLocationState = {
  issuedCounts?: Record<string, number>;
};

type CheckoutRow = {
  id: string;
  label: string;
  expected: number;
};

const ITEM_ICON_SIZE = 12;

const iconByName: Record<string, React.ReactNode> = {
  chair: <Square size={ITEM_ICON_SIZE} />,
  table: <Square size={ITEM_ICON_SIZE} />,
  mic: <Square size={ITEM_ICON_SIZE} />,
  projector: <Square size={ITEM_ICON_SIZE} />,
  bedsheet: <BedSingle size={ITEM_ICON_SIZE} />,
  "extra bed": <BedSingle size={ITEM_ICON_SIZE} />,
  runner: <Square size={ITEM_ICON_SIZE} />,
  pillows: <Square size={ITEM_ICON_SIZE} />,
  cushion: <Square size={ITEM_ICON_SIZE} />,
  duvets: <Square size={ITEM_ICON_SIZE} />,
  towels: <Shirt size={ITEM_ICON_SIZE} />,
  napkins: <UtensilsCrossed size={ITEM_ICON_SIZE} />,
};

function iconForItem(name: string) {
  return iconByName[name.toLowerCase()] ?? <Square size={ITEM_ICON_SIZE} />;
}

export function CheckOutScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { issuedCounts } = (location.state as CheckoutLocationState) || {};
  const eventId = params.eventId;
  const [event, setEvent] = React.useState<any | null>(
    () => mockRecords.find((e) => e.id === eventId) || null,
  );

  React.useEffect(() => {
    let mounted = true;
    if (eventId) {
      void apiFetch(`/api/events/${eventId}`, { method: "GET" })
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return;
          setEvent(data);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const inventory = event?.inventory ?? [];
  const eventDate = event?.eventDate
    ? new Date(`${event.eventDate}T00:00:00`)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFutureDateCheckout = Boolean(eventDate && eventDate > today);
  const [checkoutError, setCheckoutError] = React.useState("");

  const rows = React.useMemo<CheckoutRow[]>(
    () =>
      inventory.map((item: any) => ({
        id: item.id,
        label: item.name,
        expected: Math.max(0, issuedCounts?.[item.id] ?? item.issuedQty),
      })),
    [inventory, issuedCounts],
  );

  const [returnedCounts, setReturnedCounts] = React.useState<
    Record<string, number>
  >({});

  React.useEffect(() => {
    if (!event) return;
    setReturnedCounts({});
  }, [event]);

  if (!event) {
    return (
      <section className="material-stack">
        <div className="material-card material-empty">
          Check-out record not found.
        </div>
      </section>
    );
  }

  const hasReturnData = Object.values(returnedCounts).some(
    (count) => count > 0,
  );

  const decrease = (id: string) => {
    setReturnedCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, Number(prev[id] ?? 0) - 1),
    }));
  };

  const increase = (id: string) => {
    setReturnedCounts((prev) => ({
      ...prev,
      [id]: Number(prev[id] ?? 0) + 1,
    }));
  };

  const completeCheckOut = () => {
    if (isFutureDateCheckout) {
      setCheckoutError("Cannot complete checkout before the event date.");
      return;
    }

    setCheckoutError("");

    const updatedInventory = (event.inventory ?? []).map((item: any) => ({
      ...item,
      returnedQty: returnedCounts[item.id] ?? item.returnedQty ?? 0,
    }));

    void apiFetch(`/api/events/${eventId}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnedCounts }),
    })
      .then((r) => r.json())
      .then((saved) => {
        addStoredNotification(
          "checkout",
          saved.customerName ?? saved.title,
          saved.eventDate,
        );
        navigate("/completed");
      })
      .catch(() => {
        saveMockRecordUpdate(event, {
          inventory: updatedInventory,
          completed: true,
        });
        addStoredNotification(
          "checkout",
          event.customerName ?? event.title,
          event.eventDate,
        );
        navigate("/completed");
      });
  };

  return (
    <section className="material-stack">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".7rem",
          padding: "0.7rem 0.7rem 0.2rem 0.7rem",
        }}
      >
        <button
          type="button"
          className="material-icon-btn"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1
          className="material-title"
          style={{ margin: 0, fontSize: "1.08rem" }}
        >
          Check-Out
        </h1>
      </div>

      <article
        className="material-card material-attention event-info-card"
        style={{
          alignItems: "center",
          textAlign: "center",
          padding: "0.85rem 1rem",
          gap: "0.35rem",
        }}
      >
        <h2
          className="material-title"
          style={{ margin: 0, fontSize: "1.02rem", lineHeight: 1.4 }}
        >
          {event.customerName ?? event.name}
        </h2>
        <p
          className="material-desc"
          style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}
        >
          {event.venue}
        </p>
      </article>

      {isFutureDateCheckout && (
        <div
          className="material-card material-attention"
          style={{
            padding: "0.85rem 1rem",
            borderColor: "rgba(239, 68, 68, 0.35)",
            background: "rgba(254, 242, 242, 0.9)",
            color: "#991b1b",
          }}
          role="alert"
        >
          Cannot complete checkout before the event date.
        </div>
      )}

      {checkoutError && (
        <div
          className="material-card material-attention"
          style={{
            padding: "0.85rem 1rem",
            borderColor: "rgba(239, 68, 68, 0.35)",
            background: "rgba(254, 242, 242, 0.9)",
            color: "#991b1b",
          }}
          role="alert"
        >
          {checkoutError}
        </div>
      )}

      {rows.map((row) => {
        const returned = returnedCounts[row.id] ?? 0;

        return (
          <article
            className="material-card"
            key={row.id}
            style={{
              padding: "0.9rem 1rem",
              gap: "0.75rem",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: ".75rem",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                  minWidth: 0,
                }}
              >
                <span className="material-tile-icon">
                  {iconForItem(row.label)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <h3
                    className="material-title"
                    style={{
                      fontSize: "1rem",
                      margin: 0,
                      lineHeight: 1.3,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {row.label}
                  </h3>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                  justifySelf: "end",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="material-icon-btn"
                  aria-label={`Decrease ${row.label}`}
                  onClick={() => decrease(row.id)}
                  style={{ padding: "0.45rem" }}
                >
                  <Minus size={18} color="#f44336" />
                </button>
                <strong
                  style={{
                    minWidth: 28,
                    textAlign: "center",
                    fontSize: "1.15rem",
                  }}
                >
                  {returned}
                </strong>
                <button
                  type="button"
                  className="material-icon-btn"
                  aria-label={`Increase ${row.label}`}
                  onClick={() => increase(row.id)}
                  style={{ padding: "0.45rem" }}
                  disabled={returned >= row.expected}
                >
                  <Plus
                    size={18}
                    color={returned >= row.expected ? "#ccc" : "#22c55e"}
                  />
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".5rem",
                marginLeft: 44,
              }}
            >
              <span className="expected-pill">Expected: {row.expected}</span>
              {returned < row.expected && (
                <span className="missing-pill">
                  <AlertCircle size={16} style={{ marginRight: 2 }} />
                  Missing: {row.expected - returned}
                </span>
              )}
            </div>
          </article>
        );
      })}

      <button
        type="button"
        className="material-btn material-btn-primary"
        style={{
          margin: "0 auto",
          width: "100%",
          maxWidth: 480,
          justifyContent: "center",
          opacity: isFutureDateCheckout ? 0.6 : 1,
          cursor: isFutureDateCheckout ? "not-allowed" : "pointer",
        }}
        onClick={completeCheckOut}
        disabled={isFutureDateCheckout}
      >
        <Check size={18} />
        Complete Check-Out
      </button>
    </section>
  );
}
