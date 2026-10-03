import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockRecords, saveMockRecordUpdate } from "../../src/data/mock";
import apiFetch from "../utils/api";
import { addStoredNotification } from "../../src/data/notificationLog";
import {
  ArrowLeft,
  BedSingle,
  Minus,
  Plus,
  LogIn,
  Shirt,
  UtensilsCrossed,
  Square,
  Check,
} from "lucide-react";
import "../styles/modules/_material-muhurt.css";

type IssuedRow = {
  id: string;
  label: string;
  issued: number;
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

export function CheckInScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = React.useState<any | null>(
    () => mockRecords.find((item) => item.id === eventId) || null,
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

  const inventoryRows = React.useMemo<IssuedRow[]>(
    () =>
      inventory.map((item: any) => ({
        id: item.id,
        label: item.name,
        issued: item.issuedQty,
      })),
    [inventory],
  );

  const [issuedCounts, setIssuedCounts] = React.useState<
    Record<string, number>
  >({});

  React.useEffect(() => {
    if (!event) return;
    setIssuedCounts(
      Object.fromEntries(
        (event.inventory ?? []).map((item: any) => [item.id, item.issuedQty]),
      ),
    );
  }, [event]);

  if (!event) {
    return (
      <section className="material-stack">
        <div className="material-card material-empty">
          Check-in record not found.
        </div>
      </section>
    );
  }

  const hasIssuedData = Object.values(issuedCounts).some((count) => count > 0);

  const decrease = (id: string) => {
    setIssuedCounts((prev) => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
  };

  const increase = (id: string) => {
    setIssuedCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
  };

  const completeCheckIn = () => {
    const updatedInventory = (event.inventory ?? []).map((item: any) => ({
      ...item,
      issuedQty: issuedCounts[item.id] ?? item.issuedQty,
    }));

    // call API
    void apiFetch(`/api/events/${eventId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issuedCounts }),
    })
      .then((r) => r.json())
      .then((saved) => {
        addStoredNotification(
          "checkin",
          saved.customerName ?? saved.title,
          saved.eventDate,
        );
        navigate("/events");
      })
      .catch(() => {
        // fallback
        saveMockRecordUpdate(event, {
          inventory: updatedInventory,
          completed: false,
        });
        addStoredNotification(
          "checkin",
          event.customerName ?? event.title,
          event.eventDate,
        );
        navigate("/events");
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
          Check-In
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

      {inventoryRows.map((row) => {
        const expected = row.issued;
        const issued = issuedCounts[row.id] ?? 0;

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
                  <Minus size={18} />
                </button>
                <strong
                  style={{
                    minWidth: 28,
                    textAlign: "center",
                    fontSize: "1.15rem",
                  }}
                >
                  {issued}
                </strong>
                <button
                  type="button"
                  className="material-icon-btn"
                  aria-label={`Increase ${row.label}`}
                  onClick={() => increase(row.id)}
                  style={{ padding: "0.45rem" }}
                >
                  <Plus size={18} />
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
              <span className="expected-pill">Expected: {expected}</span>
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
          gap: "0.65rem",
          fontWeight: 700,
          opacity: hasIssuedData ? 1 : 0.45,
          cursor: hasIssuedData ? "pointer" : "not-allowed",
        }}
        onClick={completeCheckIn}
        disabled={!hasIssuedData}
      >
        <ArrowLeft size={18} />
        Complete Check-In
      </button>
    </section>
  );
}
