import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { Link, useLocation } from "react-router-dom";
import { getStoredNotifications } from "../../src/data/notificationLog";
import {
  Bell,
  BookOpenCheck,
  CalendarDays,
  MessageCircle,
  Sparkles,
  Trophy,
  UserCircle2,
  LayoutGrid,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import headerLogo from "../assets/header.svg";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/events", label: "Booked", icon: BookOpenCheck },
  { to: "/enquiries", label: "Enquiries", icon: MessageCircle },
  { to: "/completed", label: "Completed", icon: Trophy },
  // { to: "/inventory", label: "Inventory", icon: LayoutGrid },
  // { to: "/muhurt", label: "Muhurt", icon: Sparkles },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(
    () => getStoredNotifications().length,
  );

  useEffect(() => {
    const refreshCount = () =>
      setNotificationCount(getStoredNotifications().length);

    refreshCount();
    window.addEventListener("eventflow:notifications-updated", refreshCount);
    window.addEventListener("storage", refreshCount);

    return () => {
      window.removeEventListener(
        "eventflow:notifications-updated",
        refreshCount,
      );
      window.removeEventListener("storage", refreshCount);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const { isAdmin } = useAuth();

  const sideMenuItems: NavItem[] = [
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/events", label: "Booked", icon: BookOpenCheck },
    { to: "/enquiries", label: "Enquiries", icon: MessageCircle },
    { to: "/completed", label: "Completed", icon: Trophy },
    { to: "/inventory", label: "Inventory", icon: LayoutGrid },
    { to: "/muhurt", label: "Muhurt", icon: Sparkles },
    // admin-only users view
    ...(isAdmin ? [{ to: "/users", label: "Users", icon: UserCircle2 }] : []),
    { to: "/profile", label: "Profile", icon: UserCircle2 },
  ];

  return (
    <div className="app-shell">
      <div
        className={`side-menu-backdrop ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
      />
      <aside
        id="side-menu"
        className={`side-menu ${menuOpen ? "open" : ""}`}
        aria-label="Side menu"
      >
        <div className="side-menu-header">
          <h2 className="brand-pill side-menu-brand">
            <span>SWOJUS PALACE</span>
          </h2>
          <button
            type="button"
            className="topbar-icon"
            onClick={closeMenu}
            aria-label="Close menu"
            title="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="side-menu-nav" aria-label="Sidebar navigation">
          {sideMenuItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`side-menu-link ${active ? "active" : ""}`}
                onClick={closeMenu}
              >
                <span className="side-menu-icon">
                  <Icon size={18} strokeWidth={2.1} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="app-container">
        <header className="topbar">
          <button
            type="button"
            className="topbar-icon"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            title="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={20} />
          </button>
          <h2 className="brand-pill brand-mark-only">
            <span>SWOJUS PALACE</span>
          </h2>
          <Link
            to="/notifications"
            className="topbar-icon notification-icon"
            title={`Notifications${notificationCount > 0 ? ` (${notificationCount})` : ""}`}
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
            style={{ position: "relative" }}
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  border: "2px solid rgba(15, 23, 42, 0.9)",
                }}
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>
        </header>
        <main className="content">{children}</main>
        <nav className="bottom-tabs" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`tab-link ${active ? "active" : ""}`}
              >
                <span className="tab-icon">
                  <Icon size={21} strokeWidth={2.2} />
                </span>
                <span className="tab-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
