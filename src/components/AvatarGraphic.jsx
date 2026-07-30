import { getAvatarById } from '../data/avatars';

export default function AvatarGraphic({ avatarId = 'avatar_naruto_01', size = 48, className = '' }) {
  const avatar = getAvatarById(avatarId);
  const { bg, hair, skin, detail } = avatar;
  const gradientId = `grad-${avatar.id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg[0]} />
          <stop offset="100%" stopColor={bg[1]} />
        </linearGradient>
      </defs>

      {/* Background Gradient */}
      <circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />

      {/* Shoulders / Clothing Base */}
      <path
        d="M20 92 C 20 70, 32 64, 50 64 C 68 64, 80 92, 80 92 Z"
        fill="#0F172A"
      />

      {/* Specific Accessory / Collar Details */}
      {detail === 'straw_hat' && (
        <path d="M15 42 Q 50 20 85 42 L 92 46 Q 50 36 8 46 Z" fill="#EAB308" />
      )}
      {detail === 'straw_hat' && (
        <path d="M22 40 Q 50 26 78 40" stroke="#DC2626" strokeWidth="4" fill="none" />
      )}
      {detail === 'red_scarf' && (
        <path d="M30 62 C 30 62, 42 74, 50 74 C 58 74, 70 62, 70 62 L 70 76 L 30 76 Z" fill="#DC2626" />
      )}
      {detail === 'cravat' && (
        <path d="M42 64 L 50 78 L 58 64 Z" fill="#F8FAFC" />
      )}
      {detail === 'bamboo' && (
        <rect x="36" y="52" width="28" height="10" rx="4" fill="#15803D" stroke="#09090B" strokeWidth="1.5" />
      )}

      {/* Head / Face Base */}
      <circle cx="50" cy="46" r="22" fill={skin} />

      {/* Ears */}
      <circle cx="27" cy="46" r="4.5" fill={skin} />
      <circle cx="73" cy="46" r="4.5" fill={skin} />

      {/* Specific Hanafuda Earrings for Tanjiro */}
      {detail === 'hanafuda' && (
        <>
          <rect x="23" y="48" width="4" height="9" fill="#F8FAFC" stroke="#000" strokeWidth="1" />
          <circle cx="25" cy="51" r="1" fill="#DC2626" />
          <rect x="73" y="48" width="4" height="9" fill="#F8FAFC" stroke="#000" strokeWidth="1" />
          <circle cx="75" cy="51" r="1" fill="#DC2626" />
        </>
      )}

      {/* Hair Base Render */}
      {detail === 'bald_hero' ? (
        // Saitama Glossy Reflection
        <path d="M36 28 Q 50 22 64 28" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
      ) : detail === 'straw_hat' ? (
        // Strawhat Bangs
        <path d="M32 38 Q 40 46 50 38 Q 60 46 68 38" fill={hair} />
      ) : detail === 'dbz_spikes' ? (
        // Goku DBZ Spikes
        <path d="M14 36 L 24 16 L 36 26 L 50 6 L 64 26 L 76 16 L 86 36 L 74 38 L 50 28 L 26 38 Z" fill={hair} />
      ) : detail === 'owl_hair' ? (
        // Bokuto Horn Hair
        <path d="M26 36 L 32 14 L 46 28 L 54 28 L 68 14 L 74 36 Z" fill={hair} stroke="#09090B" strokeWidth="2" />
      ) : (
        // Default Anime Spiky / Bangs Hair
        <path d="M26 38 L 32 20 L 42 30 L 52 16 L 62 30 L 72 20 L 74 38 L 50 28 Z" fill={hair} />
      )}

      {/* Headbands / Eyewear / Masks */}
      {detail === 'headband' && (
        <g>
          <rect x="26" y="30" width="48" height="10" fill="#1E293B" rx="2" />
          <rect x="42" y="32" width="16" height="6" fill="#94A3B8" rx="1" />
          <circle cx="50" cy="35" r="1.5" fill="#1E293B" />
        </g>
      )}

      {detail === 'blindfold' && (
        <rect x="28" y="38" width="44" height="14" rx="4" fill="#09090B" />
      )}

      {detail === 'mask' && (
        <g>
          <rect x="26" y="28" width="48" height="10" fill="#1E3A8A" rx="2" />
          <polygon points="26,38 50,48 50,38" fill="#1E3A8A" />
          <path d="M30 50 C 30 50, 42 62, 50 62 C 58 62, 70 50, 70 50 L 70 65 L 30 65 Z" fill="#1E293B" />
        </g>
      )}

      {detail === 'orange_mask' && (
        <circle cx="50" cy="46" r="18" fill="#EA580C" stroke="#000" strokeWidth="1.5" />
      )}

      {/* Eyes Layer */}
      {detail !== 'blindfold' && detail !== 'mask' && detail !== 'orange_mask' && (
        <>
          {detail === 'sharingan' ? (
            <>
              <circle cx="38" cy="46" r="4.5" fill="#DC2626" />
              <circle cx="62" cy="46" r="4.5" fill="#DC2626" />
              <circle cx="38" cy="46" r="1.5" fill="#000" />
              <circle cx="62" cy="46" r="1.5" fill="#000" />
            </>
          ) : detail === 'rinnegan' ? (
            <>
              <circle cx="38" cy="46" r="5" fill="#A855F7" stroke="#000" strokeWidth="1" />
              <circle cx="62" cy="46" r="5" fill="#A855F7" stroke="#000" strokeWidth="1" />
              <circle cx="38" cy="46" r="2.5" fill="none" stroke="#000" strokeWidth="1" />
              <circle cx="62" cy="46" r="2.5" fill="none" stroke="#000" strokeWidth="1" />
            </>
          ) : (
            <>
              <ellipse cx="38" cy="46" rx="3.5" ry="4.5" fill="#0F172A" />
              <ellipse cx="62" cy="46" rx="3.5" ry="4.5" fill="#0F172A" />
              <circle cx="39" cy="44.5" r="1.2" fill="#FFFFFF" />
              <circle cx="63" cy="44.5" r="1.2" fill="#FFFFFF" />
            </>
          )}
        </>
      )}

      {/* Facial Marks / Whiskers / Scars */}
      {detail === 'headband' && (
        <g stroke="#D97706" strokeWidth="1">
          <line x1="30" y1="46" x2="35" y2="47" />
          <line x1="30" y1="49" x2="35" y2="50" />
          <line x1="65" y1="47" x2="70" y2="46" />
          <line x1="65" y1="50" x2="70" y2="49" />
        </g>
      )}

      {detail === 'sukuna_tattoos' && (
        <g stroke="#000" strokeWidth="1.5">
          <line x1="35" y1="52" x2="41" y2="52" />
          <line x1="59" y1="52" x2="65" y2="52" />
          <line x1="50" y1="36" x2="50" y2="40" />
        </g>
      )}

      {detail === 'eye_scar' && (
        <line x1="38" y1="40" x2="38" y2="52" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Mouth */}
      {detail !== 'bamboo' && detail !== 'mask' && (
        <path d="M44 56 Q 50 59 56 56" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}
