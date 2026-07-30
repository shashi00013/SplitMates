import AvatarGraphic from './AvatarGraphic';
import { DEFAULT_AVATAR_ID } from '../data/avatars';

export default function Avatar({ user, size = 'md', selected = false, className = '', onClick }) {
  if (!user) return null;

  // Determine avatar ID with fallback to naruto_uzumaki
  let avatarId = user.avatarId || user.avatar;
  if (!avatarId || typeof avatarId !== 'string') {
    avatarId = DEFAULT_AVATAR_ID;
  }

  // Size mapping for pixel dimensions
  const pixelSize = size === 'sm' ? 32 : size === 'lg' ? 56 : size === 'xl' ? 84 : 44;
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : '';
  const selectedClass = selected ? 'avatar-selected' : '';

  return (
    <div
      className={`avatar ${sizeClass} ${selectedClass} ${className}`}
      onClick={onClick}
      style={{
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        border: selected ? '2px solid var(--accent)' : '2px solid transparent',
        boxShadow: selected ? '0 0 10px rgba(204, 255, 0, 0.4)' : 'none',
        flexShrink: 0,
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      aria-label={`${user.name || 'User'}'s Avatar`}
    >
      <AvatarGraphic avatarId={avatarId} size={pixelSize} />
    </div>
  );
}
