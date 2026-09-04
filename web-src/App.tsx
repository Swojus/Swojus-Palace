import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { Navigate, Route, Routes } from "react-router-dom";
import { MuhurtProvider } from "./MuhurtContext";
import { AuthProvider, useAuth } from "./AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { InstallPrompt } from "./components/InstallPrompt";
import {
  requestBrowserNotificationPermission,
  requestNativeNotificationPermission,
} from "../src/data/notificationLog";
import {
  LoginScreen,
  BookedEventsScreen,
  CalendarScreen,
  EnquiryListScreen,
  CheckInScreen,
  CheckOutScreen,
  CompletedEventsScreen,
  InventoryOverviewScreen,
  MuhurtScreen,
  NotificationsScreen,
  ProfileScreen,
  EventFormScreen,
  MissingInventoryScreen,
} from "./pages";

const AUTH_KEY = "eventflow/authenticated";

export default function App() {
  const [authenticated, setAuthenticated] = React.useState(
    window.localStorage.getItem(AUTH_KEY) === "true",
  );

  const onLogin = React.useCallback(() => {
    window.localStorage.setItem(AUTH_KEY, "true");
    setAuthenticated(true);
  }, []);

  const onLogout = React.useCallback(() => {
    window.localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (
        window.location.protocol === "http:" ||
        window.location.protocol === "https:"
      ) {
        void requestBrowserNotificationPermission();
      }

      void requestNativeNotificationPermission();
    }
  }, []);

  if (!authenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginScreen onLogin={onLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppInner onLogout={onLogout} />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppInner({ onLogout }: { onLogout: () => void }) {
  const { isAdmin } = useAuth();

  return (
    <MuhurtProvider>
      <InstallPrompt />
      <AppLayout>
        <Routes>
          <Route path="/login" element={<Navigate to="/calendar" replace />} />
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/events" element={<BookedEventsScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/events/new" element={<EventFormScreen mode="add" />} />
          <Route
            path="/events/:eventId/edit"
            element={
              isAdmin ? (
                <EventFormScreen mode="edit" />
              ) : (
                <Navigate to="/events" replace />
              )
            }
          />
          <Route path="/events/:eventId/check-in" element={<CheckInScreen />} />
          <Route
            path="/events/:eventId/check-out"
            element={<CheckOutScreen />}
          />
          <Route path="/enquiries" element={<EnquiryListScreen />} />
          <Route path="/completed" element={<CompletedEventsScreen />} />
          <Route path="/inventory" element={<InventoryOverviewScreen />} />
          <Route
            path="/inventory/missing/:eventId"
            element={<MissingInventoryScreen />}
          />
          <Route path="/muhurt" element={<MuhurtScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route
            path="/profile"
            element={<ProfileScreen onLogout={onLogout} />}
          />
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </AppLayout>
    </MuhurtProvider>
  );
}
