import { useState, useEffect } from 'react';
import { X, Check, Dices, Sparkles, Search, Star } from 'lucide-react';
import { AVATAR_CATEGORIES, ANIME_AVATARS, getRandomAvatar, getAvatarById, DEFAULT_AVATAR_ID } from '../data/avatars';
import AvatarGraphic from './AvatarGraphic';

export default function AnimeAvatarPickerModal({ isOpen, onClose, currentAvatarId = DEFAULT_AVATAR_ID, onSelectAvatar }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('splitly_favorite_avatars');
      return saved ? JSON.parse(saved) : ['avatar_naruto_01', 'avatar_gojo_01', 'avatar_luffy_01', 'avatar_levi_01'];
    } catch (e) {
      return ['avatar_naruto_01', 'avatar_gojo_01', 'avatar_luffy_01', 'avatar_levi_01'];
    }
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatarId(currentAvatarId || DEFAULT_AVATAR_ID);
      setSearchQuery('');
    }
  }, [isOpen, currentAvatarId]);

  function toggleFavorite(id, e) {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      try {
        localStorage.setItem('splitly_favorite_avatars', JSON.stringify(updated));
      } catch (err) {
        // ignore storage errors
      }
      return updated;
    });
  }

  if (!isOpen) return null;

  const currentAvatar = getAvatarById(selectedAvatarId);

  // Filter avatars by search and category
  const filteredAvatars = ANIME_AVATARS.filter((av) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = av.name.toLowerCase().includes(q);
      const matchAnime = av.anime.toLowerCase().includes(q);
      if (!matchName && !matchAnime) return false;
    }

    if (activeCategory === 'favorites') {
      return favorites.includes(av.id);
    }
    if (activeCategory !== 'all' && !searchQuery.trim()) {
      return av.category === activeCategory;
    }

    return true;
  });

  function handleRandomize() {
    const random = getRandomAvatar();
    setSelectedAvatarId(random.id);
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anime-avatar-modal-title"
    >
      <div
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '490px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-8">
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <h2 id="anime-avatar-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Anime Avatar Gallery
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Preview & Random Button */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '12px 14px',
            margin: '12px 0 10px 0',
            borderRadius: '16px',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center gap-12">
            <div style={{ borderRadius: '50%', border: '2px solid var(--accent)', padding: '2px', boxShadow: '0 0 12px rgba(204, 255, 0, 0.35)' }}>
              <AvatarGraphic avatarId={selectedAvatarId} size={54} />
            </div>
            <div>
              <p className="text-secondary text-xs" style={{ margin: 0, fontWeight: 600 }}>Selected Avatar</p>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentAvatar.name}
              </h4>
              <span className="text-xs" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                {currentAvatar.anime}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary flex items-center gap-6"
            onClick={handleRandomize}
            id="random-anime-avatar-btn"
            style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <Dices size={16} /> 🎲 Random
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <input
            className="input"
            type="text"
            placeholder="Search character... (e.g. Gojo, Luffy, Naruto)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '38px',
              fontSize: '0.85rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              height: '42px',
            }}
            id="anime-character-search"
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        </div>

        {/* Category Tabs */}
        <div
          className="flex gap-4"
          style={{
            padding: '4px',
            background: 'var(--bg-input)',
            borderRadius: '14px',
            marginBottom: '12px',
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
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery('');
                }}
                id={`anime-tab-${cat.id}`}
                style={{
                  padding: '7px 10px',
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

        {/* Character Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            padding: '4px',
            marginBottom: '14px',
            maxHeight: '260px',
          }}
          id="anime-avatar-grid"
        >
          {filteredAvatars.length === 0 ? (
            <div style={{ gridColumn: 'span 3', padding: '30px 10px', textAlign: 'center' }}>
              <p className="text-secondary text-sm" style={{ fontWeight: 600 }}>
                {activeCategory === 'favorites' ? 'No favorite anime characters saved yet! Star your top characters.' : 'No characters found.'}
              </p>
            </div>
          ) : (
            filteredAvatars.map((av) => {
              const isSelected = selectedAvatarId === av.id;
              const isFav = favorites.includes(av.id);
              return (
                <div
                  key={av.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${av.name} Avatar`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedAvatarId(av.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedAvatarId(av.id);
                    }
                  }}
                  id={`anime-avatar-${av.id}`}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '10px 4px 8px 4px',
                    borderRadius: '16px',
                    background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card-alt)',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(204, 255, 0, 0.3)' : 'none',
                    outline: 'none',
                  }}
                >
                  {/* Star Favorite Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(av.id, e)}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      color: isFav ? '#FACC15' : 'var(--text-secondary)',
                      opacity: isFav ? 1 : 0.4,
                      zIndex: 2,
                    }}
                  >
                    <Star size={14} fill={isFav ? '#FACC15' : 'none'} />
                  </button>

                  <AvatarGraphic avatarId={av.id} size={50} />

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      marginTop: '6px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '96%',
                    }}
                  >
                    {av.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '96%',
                    }}
                  >
                    {av.anime}
                  </span>

                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
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
            })
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex gap-10">
          <button type="button" className="btn btn-secondary flex-1" onClick={onClose} id="cancel-anime-avatar-btn">
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1 flex items-center justify-center gap-6"
            onClick={handleSave}
            id="save-anime-avatar-btn"
            style={{ fontWeight: 800 }}
          >
            <Check size={18} /> Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
