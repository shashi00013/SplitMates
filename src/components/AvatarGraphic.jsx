import { getAvatarById } from '../data/avatars';

export default function AvatarGraphic({ avatarId = 'avatar_01', size = 48, className = '' }) {
  const avatar = getAvatarById(avatarId);
  const { bg, skin, index } = avatar;

  // Derive SVG visual features based on index modulo
  const hairColor = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#CCFF00', '#F43F5E', '#06B6D4', '#E11D48'][(index - 1) % 10];
  const visorColor = ['#CCFF00', '#00E5FF', '#FF007F', '#F59E0B', '#10B981', '#A855F7'][(index - 1) % 6];
  const featureType = (index - 1) % 5; // 0: Visor/Headphones, 1: Ninja Headband, 2: Neko Ears, 3: Spiky Hair/Glasses, 4: Crown/Horns

  const gradientId = `grad-${avatar.id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: '50%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg[0]} />
          <stop offset="100%" stopColor={bg[1]} />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />

      {/* Body / Shoulders */}
      <path
        d="M20 90 C 20 70, 32 64, 50 64 C 68 64, 80 70, 80 90 Z"
        fill="#1E293B"
      />
      {/* Armor / Collar Accent */}
      <path
        d="M36 65 L 50 78 L 64 65 L 50 72 Z"
        fill={hairColor}
      />

      {/* Face Head Base */}
      <circle cx="50" cy="46" r="22" fill={skin} />

      {/* Ears */}
      <circle cx="27" cy="46" r="4.5" fill={skin} />
      <circle cx="73" cy="46" r="4.5" fill={skin} />

      {/* Feature Type 0: Gaming Headphones & Cyber Visor */}
      {featureType === 0 && (
        <>
          {/* Hair top */}
          <path d="M30 38 Q 50 20 70 38 Q 50 28 30 38" fill={hairColor} />
          {/* Headphones Band */}
          <path d="M24 44 Q 50 16 76 44" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="20" y="38" width="8" height="14" rx="3" fill={hairColor} />
          <rect x="72" y="38" width="8" height="14" rx="3" fill={hairColor} />
          {/* Cyber Visor */}
          <rect x="32" y="40" width="36" height="12" rx="4" fill="#0F172A" />
          <rect x="34" y="42" width="32" height="8" rx="2" fill={visorColor} opacity="0.9" />
          {/* Smile */}
          <path d="M44 56 Q 50 60 56 56" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Feature Type 1: Ninja Headband & Anime Eyes */}
      {featureType === 1 && (
        <>
          {/* Spiky Top Hair */}
          <path d="M26 38 L 34 22 L 44 30 L 52 18 L 62 30 L 70 22 L 74 38 Z" fill={hairColor} />
          {/* Headband */}
          <rect x="26" y="32" width="48" height="10" fill="#0F172A" rx="2" />
          <rect x="42" y="34" width="16" height="6" fill="#94A3B8" rx="1" />
          {/* Anime Eyes */}
          <ellipse cx="38" cy="48" rx="3.5" ry="5" fill="#0F172A" />
          <ellipse cx="62" cy="48" rx="3.5" ry="5" fill="#0F172A" />
          <circle cx="39" cy="46" r="1.5" fill="#FFFFFF" />
          <circle cx="63" cy="46" r="1.5" fill="#FFFFFF" />
          {/* Mask / Scarf */}
          <path d="M30 52 C 30 52, 42 62, 50 62 C 58 62, 70 52, 70 52 L 70 65 L 30 65 Z" fill={hairColor} />
        </>
      )}

      {/* Feature Type 2: Neko Cat Ears & Cute Anime Expression */}
      {featureType === 2 && (
        <>
          {/* Cat Ears */}
          <path d="M26 34 L 20 16 L 38 26 Z" fill={hairColor} />
          <path d="M74 34 L 80 16 L 62 26 Z" fill={hairColor} />
          <path d="M27 31 L 23 19 L 35 26 Z" fill="#FFD1DC" />
          <path d="M73 31 L 77 19 L 65 26 Z" fill="#FFD1DC" />
          {/* Bangs */}
          <path d="M30 36 Q 40 44 50 36 Q 60 44 70 36 Q 50 28 30 36" fill={hairColor} />
          {/* Happy Anime Eyes */}
          <path d="M34 46 Q 40 40 44 46" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M56 46 Q 60 40 66 46" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Blush */}
          <circle cx="33" cy="52" r="3.5" fill="#FF4D4D" opacity="0.5" />
          <circle cx="67" cy="52" r="3.5" fill="#FF4D4D" opacity="0.5" />
          {/* Cat Mouth */}
          <path d="M44 54 Q 47 57 50 54 Q 53 57 56 54" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Feature Type 3: Cyberpunk Glasses & Cool Hair */}
      {featureType === 3 && (
        <>
          {/* Side Swept Hair */}
          <path d="M25 40 C 25 20, 50 16, 75 28 C 65 30, 45 28, 30 46 Z" fill={hairColor} />
          {/* Round Cool Sunglasses */}
          <circle cx="38" cy="46" r="7" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="62" cy="46" r="7" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="45" y1="46" x2="55" y2="46" stroke="#0F172A" strokeWidth="2" />
          <path d="M34 44 Q 38 42 42 46" stroke={visorColor} strokeWidth="1.5" fill="none" />
          <path d="M58 44 Q 62 42 66 46" stroke={visorColor} strokeWidth="1.5" fill="none" />
          {/* Cool Smirk */}
          <path d="M45 57 Q 52 60 56 55" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Feature Type 4: Crown / Horns & Heroic Eyes */}
      {featureType === 4 && (
        <>
          {/* Horns or Crown */}
          <path d="M30 30 L 36 14 L 42 26 L 50 10 L 58 26 L 64 14 L 70 30 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="1.5" />
          {/* Hair Base */}
          <path d="M28 36 Q 50 30 72 36 Q 50 28 28 36" fill={hairColor} />
          {/* Heroic Sharp Eyes */}
          <polygon points="34,44 44,47 36,49" fill="#0F172A" />
          <polygon points="66,44 56,47 64,49" fill="#0F172A" />
          <circle cx="39" cy="46" r="2" fill={visorColor} />
          <circle cx="61" cy="46" r="2" fill={visorColor} />
          {/* Determined Mouth */}
          <line x1="43" y1="56" x2="57" y2="56" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
