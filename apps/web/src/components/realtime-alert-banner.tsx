"use client";

import { ArrowRight, BellRing, X } from "lucide-react";
import type { GlobalAlert } from "@/hooks/use-campus-socket";

export function RealtimeAlertBanner({
  alert,
  onDismiss,
  onGoToChannel,
}: {
  alert: GlobalAlert | null;
  onDismiss: () => void;
  onGoToChannel?: (channelSlug: string) => void;
}) {
  if (!alert) return null;

  return (
    <aside
      aria-label="Aviso urgente de Campuslands"
      className="realtime-alert-toast"
      role="alert"
    >
      <div className="realtime-alert-glow" aria-hidden="true" />
      <div className="realtime-alert-inner">
        <div className="realtime-alert-icon-col">
          <div className="realtime-alert-badge">
            <BellRing
              size={16}
              className="realtime-alert-beacon animate-pulse"
            />
          </div>
        </div>

        <div className="realtime-alert-content">
          <div className="realtime-alert-header">
            <span className="realtime-alert-tag">AVISO PRIORITARIO</span>
            <span className="realtime-alert-channel">#{alert.channelSlug}</span>
            <span className="realtime-alert-meta">
              Por <strong>{alert.authorName}</strong> ({alert.authorRole})
            </span>
          </div>

          <p className="realtime-alert-body">{alert.content}</p>
        </div>

        <div className="realtime-alert-actions">
          {onGoToChannel && (
            <button
              type="button"
              className="button button-small realtime-alert-cta"
              onClick={() => {
                onGoToChannel(alert.channelSlug);
                onDismiss();
              }}
            >
              <span>Ver en canal</span>
              <ArrowRight size={14} />
            </button>
          )}

          <button
            type="button"
            className="icon-button realtime-alert-close"
            onClick={onDismiss}
            aria-label="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
