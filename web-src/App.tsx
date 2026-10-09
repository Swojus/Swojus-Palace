import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
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
  UsersScreen,
} from "./pages";

export default function App() {
  const [appReady, setAppReady] = React.useState(false);

  React.useEffect(() => {
    if (!appReady) return;

    const splash = document.getElementById("app-splash");
    if (!splash) return;

    splash.classList.add("hidden");
    const timer = window.setTimeout(() => splash.remove(), 400);
    return () => window.clearTimeout(timer);
  }, [appReady]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRouter onReady={() => setAppReady(true)} />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppRouter({ onReady }: { onReady: () => void }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [authReady, setAuthReady] = React.useState(false);

  // Keep hook order stable: all hooks declared unconditionally
  React.useEffect(() => {
    if (!loading) {
      setAuthReady(true);
      onReady();
    }
  }, [loading, onReady]);

  React.useEffect(() => {
    const handleAuthExpired = () => {
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:logout", handleAuthExpired);
    return () => window.removeEventListener("auth:logout", handleAuthExpired);
  }, [navigate]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Only request browser notification permission on secure origins (not during dev over unsupported hosts)
      if (
        (window.location.protocol === "http:" ||
          window.location.protocol === "https:") &&
        window.location.hostname !== "localhost"
      ) {
        void requestBrowserNotificationPermission();
      }

      void requestNativeNotificationPermission();
    }
  }, []);

  if (!authReady) {
    return null;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={() => {}} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AppInner onLogout={logout} />;
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
          <Route path="/users" element={<UsersScreen />} />
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
