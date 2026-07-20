"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Check } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { api, ApiRequestError } from "@/lib/api";
import type { Announcement, AnnouncementUnreadRes } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { Modal } from "@/components/ui/modal";

interface AnnouncementCtx {
  unreadCount: number;
  reload: () => Promise<void>;
}

const Ctx = createContext<AnnouncementCtx>({ unreadCount: 0, reload: async () => {} });

export function useAnnouncements() {
  return useContext(Ctx);
}

const SESSION_KEY = "leeklet-ann-popup-seen";

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState<Announcement[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await api.get<AnnouncementUnreadRes>("/announcements/unread");
      const list = res.announcements || [];
      setUnread(list);
      if (list.length > 0 && typeof window !== "undefined" && !sessionStorage.getItem(SESSION_KEY)) {
        setPopupOpen(true);
        sessionStorage.setItem(SESSION_KEY, "1");
      }
    } catch (e) {
      if (e instanceof ApiRequestError) console.warn(e.body);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void reload();
  }, [user, reload]);

  const markRead = useCallback(async (id: number) => {
    setUnread((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.post(`/announcements/${id}/read`);
    } catch (e) {
      if (e instanceof ApiRequestError) console.warn(e.body);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const ids = unread.map((a) => a.id);
    setUnread([]);
    setPopupOpen(false);
    try {
      await Promise.all(ids.map((id) => api.post(`/announcements/${id}/read`)));
    } catch (e) {
      if (e instanceof ApiRequestError) console.warn(e.body);
    }
  }, [unread]);

  useEffect(() => {
    if (unread.length === 0) setPopupOpen(false);
  }, [unread.length]);

  return (
    <Ctx.Provider value={{ unreadCount: unread.length, reload }}>
      {children}
      <Modal
        open={popupOpen}
        title="新公告"
        description={unread.length ? `你有 ${unread.length} 条未读公告` : undefined}
        confirmText="全部已读"
        onClose={() => setPopupOpen(false)}
        onConfirm={() => void markAllRead()}
      >
        <ul className="ann-popup-list">
          {unread.map((a) => (
            <li key={a.id} className="ann-popup-item">
              <div className="ann-popup-item-main">
                <Link
                  href="/announcements"
                  className="ann-popup-title"
                  onClick={() => setPopupOpen(false)}
                >
                  {a.title}
                </Link>
                <span className="ann-popup-time">{formatRelative(a.createdAt)}</span>
              </div>
              <button
                type="button"
                className="ann-popup-read"
                onClick={() => void markRead(a.id)}
                aria-label="标记已读"
              >
                <Check size={14} />
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </Ctx.Provider>
  );
}

export function AnnouncementBell({ size = 44 }: { size?: number }) {
  const { unreadCount } = useAnnouncements();
  return (
    <Link
      href="/announcements"
      className="app-icon-btn ann-bell"
      aria-label="公告"
      style={{ ["--ann-bell-size" as string]: `${size}px` }}
    >
      <Megaphone size={Math.round(size * 0.45)} strokeWidth={1.8} />
      {unreadCount > 0 && (
        <span className="ann-bell-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>
      )}
    </Link>
  );
}
