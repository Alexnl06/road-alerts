import React from 'react';
import { ALERT_CONFIG } from '../map/AlertMarker';
import { ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AlertListItem({ alert, onClick }) {
  const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.other;
  const timeAgo = format(new Date(alert.created_date), 'HH:mm', { locale: nl });

  const timeLeft = alert.expires_at
    ? Math.max(0, Math.round((new Date(alert.expires_at) - Date.now()) / 60000))
    : null;

  return (
    <button
      onClick={() => onClick?.(alert)}
      className="w-full flex items-center gap-4 p-4 bg-[#1E1E1E] hover:bg-[#252525] rounded-2xl transition-all active:scale-[0.98]"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: `${config.color}18` }}
      >
        {config.emoji}
      </div>

      <div className="flex-1 text-left min-w-0">
        <p className="text-white font-semibold text-sm">{config.label}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-gray-500 text-xs">{timeAgo}</span>
          {alert.direction_text && (
            <span className="text-gray-500 text-xs truncate">→ {alert.direction_text}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-400 flex items-center gap-0.5">
            <ThumbsUp size={10} /> {alert.confirm_count || 0}
          </span>
          <span className="text-red-400 flex items-center gap-0.5">
            <ThumbsDown size={10} /> {alert.deny_count || 0}
          </span>
        </div>
        {timeLeft !== null && (
          <span className="flex items-center gap-1 text-gray-500 text-[10px]">
            <Clock size={10} /> {timeLeft}m
          </span>
        )}
      </div>
    </button>
  );
}