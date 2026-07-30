import { useState } from 'react';
import { getAvatarById } from '../data/avatars';

export default function AvatarGraphic({ avatarId = 'naruto_uzumaki', size = 48, className = '' }) {
  const avatar = getAvatarById(avatarId);
  const [imgFailed, setImgFailed] = useState(false);

  const { bg, name, imageUrl } = avatar;

  // Fallback initial generator
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`avatar-graphic ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${bg[0]}, ${bg[1]})`,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {!imgFailed && imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: `${Math.max(12, Math.floor(size * 0.38))}px`,
            letterSpacing: '0.02em',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
