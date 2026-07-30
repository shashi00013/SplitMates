import { useState, useEffect } from 'react';
import { X, Check, Dices, Sparkles } from 'lucide-react';
import { AVATAR_CATEGORIES, AVATARS, getRandomAvatar, getAvatarById } from '../data/avatars';
import AvatarGraphic from './AvatarGraphic';

export default function AvatarPickerModal({ isOpen, onClose, currentAvatarId = 'avatar_01', onSelectAvatar }) {
  const [activeCategory, setActiveCategory] = useState('popular');
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatarId(currentAvatarId || 'avatar_01');
    }
  }, [isOpen, currentAvatarId]);

  if (!isOpen) return null;

  const currentAvatar = getAvatarById(selectedAvatarId);
  const filteredAvatars = AVATARS.filter((a) => a.category === activeCategory);

  function handleRandomize() {
    const random = getRandomAvatar();
    setSelectedAvatarId(random.id);
    setActiveCategory(random.category);
  }

  function handleSave() {
    onSelectAvatar(selectedAvatarId);
    onClose();
  }

  return (
    <div
      className="modal-overlay flex items-center justify-center p-16"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
    >
      <div
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-8">
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <h2 id="avatar-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Choose Your Avatar
            </h2>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Avatar Preview & Random Button */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '14px',
            margin: '14px 0',
            borderRadius: '16px',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center gap-12">
            <div style={{ borderRadius: '50%', border: '2px solid var(--accent)', padding: '2px', boxShadow: '0 0 12px rgba(204, 255, 0, 0.3)' }}>
              <AvatarGraphic avatarId={selectedAvatarId} size={52} />
            </div>
            <div>
              <p className="text-secondary text-xs" style={{ margin: 0, fontWeight: 600 }}>Selected Avatar</p>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentAvatar.name}
              </h4>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary flex items-center gap-6"
            onClick={handleRandomize}
            id="random-avatar-btn"
            style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <Dices size={16} /> 🎲 Random
          </button>
        </div>

        {/* Category Tabs */}
        <div
          className="flex gap-4"
          style={{
            padding: '4px',
            background: 'var(--bg-input)',
            borderRadius: '14px',
            marginBottom: '14px',
            overflowX: 'auto',
          }}
          role="tablist"
        >
          {AVATAR_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className="flex-1 text-xs fw-700 flex items-center justify-center gap-4"
                onClick={() => setActiveCategory(cat.id)}
                id={`avatar-tab-${cat.id}`}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Avatar Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '4px',
            marginBottom: '16px',
            maxHeight: '260px',
          }}
          id="avatar-grid"
        >
          {filteredAvatars.map((av) => {
            const isSelected = selectedAvatarId === av.id;
            return (
              <div
                key={av.id}
                tabIndex={0}
                role="button"
                aria-label={`Select ${av.name} (${av.id})`}
                aria-pressed={isSelected}
                onClick={() => setSelectedAvatarId(av.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedAvatarId(av.id);
                  }
                }}
                id={`avatar-card-${av.id}`}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 6px',
                  borderRadius: '16px',
                  background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card-alt)',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 10px rgba(204, 255, 0, 0.25)' : 'none',
                  outline: 'none',
                }}
              >
                <AvatarGraphic avatarId={av.id} size={54} />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                    marginTop: '6px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {av.name}
                </span>
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex gap-10">
          <button
            type="button"
            className="btn btn-secondary flex-1"
            onClick={onClose}
            id="cancel-avatar-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1 flex items-center justify-center gap-6"
            onClick={handleSave}
            id="save-avatar-btn"
            style={{ fontWeight: 800 }}
          >
            <Check size={18} /> Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
