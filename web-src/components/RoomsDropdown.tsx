import React from "react";
import { createPortal } from "react-dom";

interface RoomsDropdownProps {
  selectedRooms: string[];
  onChange: (rooms: string[]) => void;
}

export function RoomsDropdown({ selectedRooms, onChange }: RoomsDropdownProps) {
  // Refs for 'Select All' checkboxes
  const phase1Ref = React.useRef<HTMLInputElement>(null);
  const phase2Ref = React.useRef<HTMLInputElement>(null);
  const othersRef = React.useRef<HTMLInputElement>(null);

  // Room arrays
  const phase1Rooms = [101, 102, 103, 104, 105, 106, 107, 108, 109];
  const phase2Rooms = [101, 102, 103, 104, 105, 106];
  const othersRooms = [
    101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 201, 202, 203, 204, 205,
    206, 207, 208, 209, 210, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310,
    401, 402, 403, 404, 405, 406, 407, 408, 409, 410,
  ];

  // Set indeterminate state for each group
  React.useEffect(() => {
    if (phase1Ref.current) {
      const allSelected = phase1Rooms.every((room) =>
        selectedRooms.includes(`Phase 1-${room}`),
      );
      const someSelected = selectedRooms.some((room) =>
        room.startsWith("Phase 1-"),
      );
      phase1Ref.current.indeterminate = someSelected && !allSelected;
    }
    if (phase2Ref.current) {
      const allSelected = phase2Rooms.every((room) =>
        selectedRooms.includes(`Phase 2-${room}`),
      );
      const someSelected = selectedRooms.some((room) =>
        room.startsWith("Phase 2-"),
      );
      phase2Ref.current.indeterminate = someSelected && !allSelected;
    }
    if (othersRef.current) {
      const allSelected = othersRooms.every((room) =>
        selectedRooms.includes(`Others-${room}`),
      );
      const someSelected = selectedRooms.some((room) =>
        room.startsWith("Others-"),
      );
      othersRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [selectedRooms]);
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const portalNodeRef = React.useRef<HTMLDivElement | null>(null);
  const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideDropdown = dropdownRef.current?.contains(target);
      const insidePortal = portalNodeRef.current?.contains(target);
      if (!insideDropdown && !insidePortal) setOpen(false);
    }

    function updatePortalPosition() {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      setPortalStyle({
        position: "absolute",
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY,
        width: rect.width,
        zIndex: 1302,
      });
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", updatePortalPosition);
      window.addEventListener("scroll", updatePortalPosition, true);
      updatePortalPosition();
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [open]);

  const summary =
    selectedRooms.length === 0
      ? "Select rooms..."
      : selectedRooms.length <= 3
        ? selectedRooms.join(", ")
        : `${selectedRooms.length} rooms selected`;

  return (
    <div style={{ position: "relative", marginBottom: 16 }} ref={dropdownRef}>
      <label
        style={{
          width: "100%",
          fontWeight: 600,
          fontSize: 16,
          marginBottom: 4,
          display: "block",
        }}
      >
        Select Rooms
      </label>
      <div
        style={{
          border: "1.5px solid #d1d5db",
          borderRadius: "12px",
          background: "#fafbff",
          padding: "12px",
          marginTop: 4,
          marginBottom: 8,
          boxShadow: "0 2px 8px #e6e6f6",
          cursor: "pointer",
          color: selectedRooms.length === 0 ? "#888" : "#222",
          fontSize: 16,
          userSelect: "none",
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {summary}
        <span
          style={{
            float: "right",
            fontWeight: 700,
            fontSize: 18,
            color: "#aaa",
          }}
        >
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open &&
        createPortal(
          <div
            style={{
              ...portalStyle,
              background: "#fff",
              border: "1.5px solid #bdbdbd",
              borderRadius: "12px",
              boxShadow:
                "0 8px 32px 0 rgba(99,102,241,0.10), 0 1.5px 8px #e6e6f6",
              padding: 16,
              maxHeight: 420,
              overflowY: "auto",
              minHeight: 180,
              scrollbarColor: "#bdbdbd #f0f0fa",
              scrollbarWidth: "thin",
            }}
            ref={portalNodeRef as any}
          >
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>Phase 1 (9)</span>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: "#f0f0fa",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 14,
                  }}
                >
                  <input
                    ref={phase1Ref}
                    type="checkbox"
                    checked={phase1Rooms.every((room) =>
                      selectedRooms.includes(`Phase 1-${room}`),
                    )}
                    onChange={(e) => {
                      const allRooms = phase1Rooms.map((r) => `Phase 1-${r}`);
                      if (e.target.checked) {
                        onChange(
                          Array.from(new Set([...selectedRooms, ...allRooms])),
                        );
                      } else {
                        onChange(
                          selectedRooms.filter((r) => !allRooms.includes(r)),
                        );
                      }
                    }}
                    style={{ marginRight: 6 }}
                  />
                  Select All
                </label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[101, 102, 103, 104, 105, 106, 107, 108, 109].map((room) => (
                  <label
                    key={`p1-${room}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "6px 14px",
                      marginBottom: 6,
                      boxShadow: "0 1px 4px #ececf6",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(`Phase 1-${room}`)}
                      onChange={(e) => {
                        const newRooms = e.target.checked
                          ? [...selectedRooms, `Phase 1-${room}`]
                          : selectedRooms.filter(
                              (r: string) => r !== `Phase 1-${room}`,
                            );
                        onChange(newRooms);
                      }}
                      style={{ marginRight: 6 }}
                    />
                    {room}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>Phase 2 (6)</span>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: "#f0f0fa",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 14,
                  }}
                >
                  <input
                    ref={phase2Ref}
                    type="checkbox"
                    checked={phase2Rooms.every((room) =>
                      selectedRooms.includes(`Phase 2-${room}`),
                    )}
                    onChange={(e) => {
                      const allRooms = phase2Rooms.map((r) => `Phase 2-${r}`);
                      if (e.target.checked) {
                        onChange(
                          Array.from(new Set([...selectedRooms, ...allRooms])),
                        );
                      } else {
                        onChange(
                          selectedRooms.filter((r) => !allRooms.includes(r)),
                        );
                      }
                    }}
                    style={{ marginRight: 6 }}
                  />
                  Select All
                </label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[101, 102, 103, 104, 105, 106].map((room) => (
                  <label
                    key={`p2-${room}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "6px 14px",
                      marginBottom: 6,
                      boxShadow: "0 1px 4px #ececf6",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(`Phase 2-${room}`)}
                      onChange={(e) => {
                        const newRooms = e.target.checked
                          ? [...selectedRooms, `Phase 2-${room}`]
                          : selectedRooms.filter(
                              (r: string) => r !== `Phase 2-${room}`,
                            );
                        onChange(newRooms);
                      }}
                      style={{ marginRight: 6 }}
                    />
                    {room}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>Others (40)</span>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: "#f0f0fa",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 14,
                  }}
                >
                  <input
                    ref={othersRef}
                    type="checkbox"
                    checked={othersRooms.every((room) =>
                      selectedRooms.includes(`Others-${room}`),
                    )}
                    onChange={(e) => {
                      const allRooms = othersRooms.map((r) => `Others-${r}`);
                      if (e.target.checked) {
                        onChange(
                          Array.from(new Set([...selectedRooms, ...allRooms])),
                        );
                      } else {
                        onChange(
                          selectedRooms.filter((r) => !allRooms.includes(r)),
                        );
                      }
                    }}
                    style={{ marginRight: 6 }}
                  />
                  Select All
                </label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 201, 202,
                  203, 204, 205, 206, 207, 208, 209, 210, 301, 302, 303, 304,
                  305, 306, 307, 308, 309, 310, 401, 402, 403, 404, 405, 406,
                  407, 408, 409, 410,
                ].map((room) => (
                  <label
                    key={`oth-${room}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "#fff",
                      borderRadius: 8,
                      padding: "6px 14px",
                      marginBottom: 6,
                      boxShadow: "0 1px 4px #ececf6",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(`Others-${room}`)}
                      onChange={(e) => {
                        const newRooms = e.target.checked
                          ? [...selectedRooms, `Others-${room}`]
                          : selectedRooms.filter(
                              (r: string) => r !== `Others-${room}`,
                            );
                        onChange(newRooms);
                      }}
                      style={{ marginRight: 6 }}
                    />
                    {room}
                  </label>
                ))}
              </div>
            </div>
          </div>,
          (portalNodeRef.current ??= document.createElement("div")),
        )}
    </div>
  );
}
