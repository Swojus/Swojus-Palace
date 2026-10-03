import React from "react";
import apiFetch from "./utils/api";

export type MuhurtDate = {
  id: string;
  date: string;
  description: string;
};

type AddMuhurtDateInput = {
  date: string;
  description: string;
};

type MuhurtContextValue = {
  muhurtDates: MuhurtDate[];
  todayMuhurtDates: MuhurtDate[];
  addMuhurtDate: (input: AddMuhurtDateInput) => void;
  removeMuhurtDate: (id: string) => void;
};

const STORAGE_KEY = "eventflow/muhurt-dates";

const initialMuhurtDates: MuhurtDate[] = [];

function normalizeMuhurtDate(item: any): MuhurtDate {
  return {
    id: item?.id ?? item?._id ?? "",
    date: item?.date ?? "",
    description: item?.description ?? "",
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

  React.useEffect(() => {
    let mounted = true;
    void apiFetch(`/api/muhurt`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          setMuhurtDates(
            data.map(normalizeMuhurtDate).filter((item) => item.id),
          );
        }
      })
      .catch(() => {
        // keep local initial data on failure
      });
    return () => {
      mounted = false;
    };
  }, []);

  const today = toIsoDate(new Date());
  const todayMuhurtDates = React.useMemo(
    () => muhurtDates.filter((item) => item.date === today),
    [muhurtDates, today],
  );

  const addMuhurtDate = React.useCallback(
    ({ date, description }: AddMuhurtDateInput) => {
      void apiFetch(`/api/muhurt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, description }),
      })
        .then((r) => r.json())
        .then((created) => {
          setMuhurtDates((current) => [
            ...current,
            normalizeMuhurtDate(created),
          ]);
        })
        .catch(() => {
          // ignore errors for now
        });
    },
    [],
  );

  const removeMuhurtDate = React.useCallback((id: string) => {
    void apiFetch(`/api/muhurt/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then(() => {
        setMuhurtDates((current) => current.filter((item) => item.id !== id));
      })
      .catch(() => {
        // ignore errors for now
      });
  }, []);

  const value = React.useMemo(
    () => ({ muhurtDates, todayMuhurtDates, addMuhurtDate, removeMuhurtDate }),
    [muhurtDates, todayMuhurtDates, addMuhurtDate, removeMuhurtDate],
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
