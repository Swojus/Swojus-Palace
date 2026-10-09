export type InventoryItem = {
  id: string;
  name: string;
  plannedQty: number;
  issuedQty: number;
  returnedQty: number;
  rate?: number;
};

export type RecordSource = "Enquiry" | "Booking";

export type RecordItem = {
  _id: string;
  id: string;
  title: string;
  customerName?: string;
  name?: string;
  phone?: string;
  altPhone?: string;
  venue: string;
  rooms: string[];
  eventDate?: string;
  eventTime?: string;
  eventType?: string;
  eventSource: RecordSource;
  inventory?: InventoryItem[];
  completed?: boolean;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  EventForm: { mode: "add" | "edit"; eventId?: string } | undefined;
  CheckIn: { eventId: string };
  CheckOut: { eventId: string };
  MissingInventory: { eventId: string };
  Profile: undefined;
  Notifications: undefined;
};

export type TabsParamList = {
  BookedEvents: undefined;
  Enquiries: undefined;
  CompletedEvents: undefined;
  Inventory: undefined;
  Muhurt: undefined;
  Profile: undefined;
};
