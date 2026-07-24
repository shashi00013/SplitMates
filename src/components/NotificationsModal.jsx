import { X, CheckCheck, Bell, Clock } from 'lucide-react';
import { formatDate } from '../data/mockData';

export default function NotificationsModal({ isOpen, onClose, notifications, unreadCount, onMarkRead, onMarkAllRead }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '92%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center"
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div className="flex items-center gap-10">
            <Bell size={20} className="text-accent" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action bar */}
        {notifications && notifications.length > 0 && unreadCount > 0 && (
          <div
            className="flex justify-end"
            style={{ padding: '8px 20px', background: 'var(--bg-card-alt)', borderBottom: '1px solid var(--border-color)' }}
          >
            <button
              onClick={onMarkAllRead}
              className="text-xs text-accent flex items-center gap-4"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </div>
        )}

        {/* Content list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
          {!notifications || notifications.length === 0 ? (
            <div className="text-center" style={{ padding: '40px 16px' }}>
              <Bell size={36} className="text-secondary" style={{ opacity: 0.4, marginBottom: '12px' }} />
              <p className="text-secondary text-sm" style={{ fontWeight: 600 }}>You're all caught up 🎉</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && onMarkRead(n.id)}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  marginBottom: '10px',
                  background: n.read ? 'transparent' : 'var(--accent-dim)',
                  border: n.read ? '1px solid var(--border-color)' : '1px solid var(--accent)',
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="flex justify-between items-start" style={{ marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {n.title}
                  </h4>
                  {!n.read && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                  )}
                </div>
                <p className="text-secondary text-xs" style={{ lineHeight: 1.4, marginBottom: '6px' }}>
                  {n.message}
                </p>
                <div className="flex items-center gap-4 text-tertiary" style={{ fontSize: '0.7rem' }}>
                  <Clock size={12} />
                  <span>{formatDate(n.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
