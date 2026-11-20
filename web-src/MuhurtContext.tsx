import React from "react";
import apiFetch from "./utils/api";

export type MuhurtDate = {
  id: string;
  date: string;
  description: string;
  type: "Main Muhurt" | "Sub Muhurt";
};

type AddMuhurtDateInput = {
  date: string;
  description: string;
  type: MuhurtDate["type"];
};

type MuhurtContextValue = {
  muhurtDates: MuhurtDate[];
  todayMuhurtDates: MuhurtDate[];
  muhurtError: string;
  refreshMuhurtDates: () => Promise<void>;
  addMuhurtDate: (input: AddMuhurtDateInput) => void;
  removeMuhurtDate: (id: string) => void;
};

const initialMuhurtDates: MuhurtDate[] = [];

function normalizeMuhurtDate(item: any): MuhurtDate {
  return {
    id: item?.id ?? item?._id ?? "",
    date: item?.date ?? "",
    description: item?.description ?? "",
    type: item?.type === "Sub Muhurt" ? "Sub Muhurt" : "Main Muhurt",
  };
}

const MuhurtContext = React.createContext<MuhurtContextValue | undefined>(
  undefined,
);

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MuhurtProvider({ children }: { children: React.ReactNode }) {
  const [muhurtDates, setMuhurtDates] =
    React.useState<MuhurtDate[]>(initialMuhurtDates);
  const [muhurtError, setMuhurtError] = React.useState("");
  const requestId = React.useRef(0);

  const refreshMuhurtDates = React.useCallback(async () => {
    const activeRequestId = ++requestId.current;
    setMuhurtError("");

    try {
      const response = await apiFetch(`/api/muhurt`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`Unable to load Muhurt dates (${response.status}).`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("The Muhurt service returned an invalid response.");
      }

      if (activeRequestId === requestId.current) {
        setMuhurtDates(
          data.map(normalizeMuhurtDate).filter((item) => item.id && item.date),
        );
      }
    } catch (error) {
      if (activeRequestId === requestId.current) {
        setMuhurtError(
          error instanceof Error ? error.message : "Unable to load Muhurt dates.",
        );
      }
    }
  }, []);

  React.useEffect(() => {
    void refreshMuhurtDates();
  }, [refreshMuhurtDates]);

  const today = toIsoDate(new Date());
  const todayMuhurtDates = React.useMemo(
    () => muhurtDates.filter((item) => item.date === today),
    [muhurtDates, today],
  );

  const addMuhurtDate = React.useCallback(
    ({ date, description, type }: AddMuhurtDateInput) => {
      setMuhurtError("");
      void apiFetch(`/api/muhurt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, description, type }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Unable to save Muhurt date (${response.status}).`);
          }
          return response.json();
        })
        .then((created) => {
          const item = normalizeMuhurtDate({ ...created, type });
          if (!item.id || !item.date) {
            throw new Error("The Muhurt service returned an invalid saved date.");
          }
          requestId.current += 1;
          setMuhurtDates((current) => [...current, item]);
        })
        .catch((error: unknown) => {
          setMuhurtError(
            error instanceof Error ? error.message : "Unable to save Muhurt date.",
          );
        });
    },
    [],
  );

  const removeMuhurtDate = React.useCallback((id: string) => {
    setMuhurtError("");
    void apiFetch(`/api/muhurt/${id}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to delete Muhurt date (${response.status}).`);
        }
        return response.json();
      })
      .then(() => {
        requestId.current += 1;
        setMuhurtDates((current) => current.filter((item) => item.id !== id));
      })
      .catch((error: unknown) => {
        setMuhurtError(
          error instanceof Error ? error.message : "Unable to delete Muhurt date.",
        );
      });
  }, []);

  const value = React.useMemo(
    () => ({
      muhurtDates,
      todayMuhurtDates,
      muhurtError,
      refreshMuhurtDates,
      addMuhurtDate,
      removeMuhurtDate,
    }),
    [
      muhurtDates,
      todayMuhurtDates,
      muhurtError,
      refreshMuhurtDates,
      addMuhurtDate,
      removeMuhurtDate,
    ],
  );

  return (
    <MuhurtContext.Provider value={value}>{children}</MuhurtContext.Provider>
  );
}

export function useMuhurt() {
  const context = React.useContext(MuhurtContext);
  if (!context) {
    throw new Error("useMuhurt must be used within a MuhurtProvider");
  }
  return context;
}
