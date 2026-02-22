import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const ALERT_CONFIG = {
  ambulance: { color: '#00C853', label: 'Ambulance', emoji: '🚑' },
  fire: { color: '#FF3B30', label: 'Brandweer', emoji: '🚒' },
  police: { color: '#2979FF', label: 'Politie', emoji: '🚔' },
  rescue: { color: '#00C853', label: 'Rescue', emoji: '🚨' },
  undercover: { color: '#1A1A1A', label: 'Undercover politie', emoji: '🕵️' },
  other: { color: '#FFC107', label: 'Overig', emoji: '⚠️' },
  mobile_check: { color: '#FF9500', label: 'Mobiele flitser', emoji: '📸' },
  fixed_camera: { color: '#9C27B0', label: 'Vaste flitser', emoji: '📷' },
  average_speed_zone: { color: '#00BCD4', label: 'Trajectcontrole', emoji: '🛣️' },
  accident: { color: '#FF6B6B', label: 'Ongeval', emoji: '💥' },
  roadworks: { color: '#FFA500', label: 'Wegwerkzaamheden', emoji: '🚧' },
  stationary_vehicle: { color: '#9E9E9E', label: 'Stilstaand voertuig', emoji: '🚗' },
  animal: { color: '#8BC34A', label: 'Dier op de weg', emoji: '🦌' },
  object: { color: '#795548', label: 'Object op de weg', emoji: '📦' },
};

function createAlertIcon(type) {
  const config = ALERT_CONFIG[type] || ALERT_CONFIG.other;
  return L.divIcon({
    className: 'custom-alert-marker',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${config.color};
        clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 50% 85%, 18% 100%, 0% 38%);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; position: relative;
        box-shadow: 0 2px 8px ${config.color}66;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
      ">
        <span style="line-height:1; transform: scaleY(-1); display: flex; align-items: center; justify-content: center;">${config.emoji}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export { ALERT_CONFIG };

export default function AlertMarker({ alert, onClick }) {
  const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.unknown;
  const timeAgo = format(new Date(alert.created_date), 'HH:mm', { locale: nl });

  return (
    <Marker
      position={[alert.lat, alert.lng]}
      icon={createAlertIcon(alert.type)}
      eventHandlers={{ click: () => onClick?.(alert) }}
    >
      <Popup className="dark-popup">
        <div className="text-white text-sm min-w-[180px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.emoji}</span>
            <span className="font-semibold">{config.label}</span>
          </div>
          <div className="text-gray-400 text-xs">Gemeld om {timeAgo}</div>
          {alert.direction_text && (
            <div className="text-gray-300 text-xs mt-1">Richting: {alert.direction_text}</div>
          )}
          {alert.note && (
            <div className="text-gray-300 text-xs mt-1 italic">"{alert.note}"</div>
          )}
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-green-400">✓ {alert.confirm_count || 0}</span>
            <span className="text-red-400">✕ {alert.deny_count || 0}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}