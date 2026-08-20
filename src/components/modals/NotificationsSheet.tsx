"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Bell, BellOff, Megaphone, Plus, User, X } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAppData } from "@/lib/AppDataProvider";
import { markNotificationsRead, sendAnnouncement } from "@/app/actions/notifications";
import { ANNOUNCEMENT_ROLES } from "@/lib/types";
import type { AppNotification } from "@/lib/types";
import type { FormActionState } from "@/app/actions/donations";

const initialState: FormActionState = { error: null };

export function NotificationsSheet({
  notifications,
  onClose,
}: {
  notifications: AppNotification[];
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const { profile } = useAppData();
  const canAnnounce = ANNOUNCEMENT_ROLES.includes(profile.role);
  const [showCompose, setShowCompose] = useState(false);
  const [state, formAction, pending] = useActionState(sendAnnouncement, initialState);
  const attempted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (pending) attempted.current = true;
    if (!pending && attempted.current && state.error === null) {
      formRef.current?.reset();
      setShowCompose(false);
      attempted.current = false;
    }
  }, [pending, state]);

  // بمجرد ما يفتح المستخدم لوحة الإشعارات، منعتبرهم كلهم مقروين — العلامة عالجرس بتروح.
  useEffect(() => {
    if (notifications.length > 0) {
      markNotificationsRead(notifications.map((n) => n.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="print:hidden fixed inset-0 bg-black/40 z-40 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-b-3xl sm:rounded-3xl sm:mt-20 p-5 space-y-3 shadow-lg max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800 flex items-center gap-1">
            <Bell size={16} /> {t.notifications}
          </p>
          <div className="flex items-center gap-2">
            {canAnnounce && (
              <button
                type="button"
                onClick={() => setShowCompose((v) => !v)}
                className="w-7 h-7 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"
                title={t.newAnnouncement}
              >
                <Plus size={16} />
              </button>
            )}
            <button type="button" onClick={onClose}>
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {canAnnounce && showCompose && (
          <form ref={formRef} action={formAction} className="bg-orange-50 border border-orange-200 rounded-2xl p-3 space-y-2">
            <p className="text-xs font-bold text-orange-800">{t.newAnnouncement}</p>
            <textarea
              name="message"
              required
              rows={3}
              placeholder={t.announcementPlaceholder}
              className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-orange-500 bg-white"
            />
            {state.error && <p className="text-xs text-red-600">{state.error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-orange-600 text-white rounded-xl py-2 text-xs font-bold disabled:opacity-60 transition-transform duration-150 active:scale-[0.98]"
            >
              {pending ? "..." : t.sendAnnouncement}
            </button>
          </form>
        )}

        {notifications.length === 0 ? (
          <EmptyState icon={BellOff} title={t.noNotifications} />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="bg-slate-50 rounded-2xl p-3 space-y-1 transition-colors duration-150 hover:bg-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-700">{lang === "ar" ? n.message_ar : n.message_en}</p>
                  <p className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.created_at).toISOString().slice(0, 10)}
                  </p>
                </div>
                <p className="flex items-center gap-1 text-[11px] text-slate-400">
                  {n.sender_name ? (
                    <>
                      <User size={10} /> {t.sentBy} {n.sender_name}
                    </>
                  ) : (
                    <>
                      <Megaphone size={10} /> {t.appName}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
