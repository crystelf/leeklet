"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LetterLoader } from "@/components/ui/letter-loader";
import {
  AnnouncementProvider,
  AnnouncementBell,
} from "@/components/announcements/announcement-provider";
import { LeekLogoWord, LeekLogo } from "./leek-logo";
import { visibleNav, MOBILE_PRIMARY } from "./nav-config";
import { remainingDays, roleLabel } from "@/lib/format";
import "./app-shell.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <AnnouncementProvider>
      <div className="app-shell">
        <DesktopSidebar pathname={pathname} />
        <MobileTopbar onMenu={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname} />
        <main className="app-main">
          <div key={pathname} className="app-content stagger">
            {children}
          </div>
        </main>
        <MobileBottomNav pathname={pathname} />
      </div>
    </AnnouncementProvider>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  const { user, logout } = useAuth();
  const items = visibleNav(user?.role);
  const activeHref = resolveActiveHref(pathname, items.map((item) => item.href));

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-head">
        <LeekLogoWord size={34} />
      </div>

      <nav className="app-sidebar-nav" aria-label="主导航">
        {items.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("app-nav-item", active && "app-nav-item-active")}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="app-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar-foot">
        <UserCard />
        <div className="app-sidebar-toggle">
          <ThemeToggle size={48} />
          <AnnouncementBell size={48} />
        </div>
        <button
          type="button"
          className="app-logout"
          onClick={() => void logout()}
          aria-label="登出"
        >
          <LogOut size={15} />
          <span>登出</span>
        </button>
      </div>
    </aside>
  );
}

function MobileTopbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="app-topbar">
      <button
        type="button"
        className="app-icon-btn"
        aria-label="打开菜单"
        onClick={onMenu}
      >
        <Menu size={20} />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <LeekLogo size={28} />
        <span className="font-display font-bold text-base" style={{ color: "var(--fg)" }}>
          Leeklet
        </span>
      </Link>
      <div className="app-topbar-actions">
        <AnnouncementBell size={40} />
        <ThemeToggle size={40} />
      </div>
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const { user, logout } = useAuth();
  const items = visibleNav(user?.role);
  const activeHref = resolveActiveHref(pathname, items.map((item) => item.href));
  if (!open) return null;

  return (
    <>
      <div className="app-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="app-drawer" role="dialog" aria-modal="true" aria-label="导航菜单">
        <div className="app-drawer-head">
          <LeekLogoWord size={32} />
          <button
            type="button"
            className="app-icon-btn"
            aria-label="关闭菜单"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="app-drawer-nav">
          {items.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("app-nav-item", active && "app-nav-item-active")}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span className="app-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="app-drawer-foot">
          <UserCard />
          <button
            type="button"
            className="app-logout"
            onClick={() => void logout()}
          >
            <LogOut size={15} />
            <span>登出</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  const items = visibleNav(user?.role).filter((it) =>
    MOBILE_PRIMARY.includes(it.href)
  );
  const activeHref = resolveActiveHref(
    pathname,
    items.map((item) => item.href)
  );
  return (
    <nav className="app-bottom-nav" aria-label="底部导航">
      {items.map((item) => {
        const active = item.href === activeHref;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("app-bottom-item", active && "app-bottom-item-active")}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="app-usercard" style={{ minHeight: 56 }}>
        <LetterLoader size="sm" />
      </div>
    );
  }

  const days = remainingDays(user.memberUntil);
  return (
    <div className="app-usercard">
      <img
        className="app-usercard-avatar"
        src={`https://q.qlogo.cn/headimg_dl?dst_uin=${user.qq}&spec=100`}
        alt={user.nickname ?? `QQ ${user.qq}`}
        loading="lazy"
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="app-usercard-body">
        <div className="app-usercard-top">
          <span className="app-usercard-qq">{user.nickname ?? user.qq}</span>
        </div>
        <div className="app-usercard-sub">
          {user.role === "member" && days !== null
            ? days > 0
              ? `会员剩余 ${days} 天`
              : "会员已过期"
            : roleLabel(user.role)}
        </div>
      </div>
    </div>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 最长匹配优先:子路由有独立导航项时(如 /admin/connect),
 * 父级(/admin)不再同时点亮;子路由无导航项时(如 /feedback/123)父级保持点亮。
 */
function resolveActiveHref(pathname: string, hrefs: readonly string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (!isActive(pathname, href)) continue;
    if (best === null || href.length > best.length) best = href;
  }
  return best;
}
