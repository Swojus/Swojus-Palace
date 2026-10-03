import type { RecordItem } from "../types";

// Toggle client-side mock data. Set to `true` to enable mocks during local development.
const USE_MOCKS = false;

export const getDefaultInventory = () => [
  {
    id: "bedsheet",
    name: "Bedsheet",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
  {
    id: "extra-bed",
    name: "Extra Bed",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
  {
    id: "runner",
    name: "Runner",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
  {
    id: "pillows",
    name: "Pillows",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
  {
    id: "cushion",
    name: "Cushion",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
  {
    id: "duvets",
    name: "Duvets",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
  {
    id: "towels",
    name: "Towels",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
  {
    id: "napkins",
    name: "Napkins",
    plannedQty: 0,
    issuedQty: 0,
    returnedQty: 0,
  },
];

const fixedInventory = getDefaultInventory();

// Mock data is intentionally disabled. Keep the array empty so the app uses only real backend data.
export let mockRecords: RecordItem[] = [];

export function createMockRecordId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type MockRecordDraft = Omit<RecordItem, "id">;

function normalizeCompletedFlag(record: MockRecordDraft, existingId?: string) {
  if (!existingId) {
    return {
      ...record,
      completed: false,
    };
  }

  const existingRecord = mockRecords.find((item) => item.id === existingId);

  return {
    ...record,
    completed: record.completed ?? existingRecord?.completed === true,
  };
}

export function saveMockRecord(record: MockRecordDraft, existingId?: string) {
  const normalizedRecord = normalizeCompletedFlag(record, existingId);

  const savedRecord: RecordItem = {
    ...normalizedRecord,
    id: existingId ?? createMockRecordId(),
  };

  if (existingId) {
    const existingIndex = mockRecords.findIndex(
      (item) => item.id === existingId,
    );

    if (existingIndex !== -1) {
      mockRecords[existingIndex] = savedRecord;
      return savedRecord;
    }
  }

  mockRecords.push(savedRecord);
  return savedRecord;
}

// Mock seeding is disabled; do not generate any placeholder data for the app.

export function saveMockRecordUpdate(
  existingRecord: RecordItem,
  updates: Partial<RecordItem>,
) {
  return saveMockRecord(
    {
      ...existingRecord,
      ...updates,
    },
    existingRecord.id,
  );
}

export function getRecordDate(record: RecordItem) {
  return record.eventDate ?? "";
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";

  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";

  return toDateKey(parsed);
}

export function sortRecordsByDateTime(records: RecordItem[]) {
  return [...records].sort((a, b) => {
    const timeA = getRecordDateTimeValue(a);
    const timeB = getRecordDateTimeValue(b);
    return timeA - timeB;
  });
}

function getRecordDateTimeValue(record: RecordItem) {
  if (!record.eventDate) return Number.POSITIVE_INFINITY;

  const parsed = new Date(`${record.eventDate}T${record.eventTime ?? "00:00"}`);

  return Number.isNaN(parsed.getTime())
    ? Number.POSITIVE_INFINITY
    : parsed.getTime();
}

export function isRecordCompleted(record: RecordItem) {
  if (record.completed === true) {
    return true;
  }

  const date = normalizeDateKey(getRecordDate(record));
  if (!date) return false;

  return date < toDateKey(new Date());
}
