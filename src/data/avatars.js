// ============================================================
// BUILT-IN AVATAR LIBRARY (60 ORIGINAL ANIME / GAMING / CARTOON AVATARS)
// Lightweight SVG renders with vibrant colors, helmets, hair, headsets & accessories
// ============================================================

export const AVATAR_CATEGORIES = [
  { id: 'popular', name: 'Popular', icon: '🔥' },
  { id: 'action', name: 'Action', icon: '⚔️' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'favorites', name: 'Favorites', icon: '⭐' },
];

export const DEFAULT_AVATAR_ID = 'avatar_01';

// Helper to generate consistent SVG features based on avatar index
function getAvatarProps(index) {
  const bgGradients = [
    ['#FF007F', '#7928CA'], ['#00DFD8', '#007CF0'], ['#7928CA', '#FF0080'],
    ['#FF4D4D', '#F9CB28'], ['#00E5FF', '#120E43'], ['#CCFF00', '#10B981'],
    ['#8B5CF6', '#EC4899'], ['#F59E0B', '#EF4444'], ['#06B6D4', '#3B82F6'],
    ['#A855F7', '#6366F1'], ['#14B8A6', '#06B6D4'], ['#F43F5E', '#FB7185'],
  ];

  const bg = bgGradients[index % bgGradients.length];

  const skinTones = ['#FFD1DC', '#F5C6A5', '#E0A96D', '#8C6239', '#5C3A21', '#FFE5D9'];
  const skin = skinTones[index % skinTones.length];

  return { bg, skin };
}

// Generates 60 unique Anime / Gaming / Minimal Character Avatars
export const AVATARS = Array.from({ length: 60 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  const id = `avatar_${num}`;
  const { bg, skin } = getAvatarProps(i);

  let category = 'popular';
  if (i >= 15 && i < 30) category = 'action';
  else if (i >= 30 && i < 45) category = 'gaming';
  else if (i >= 45) category = 'favorites';

  const names = [
    'Cyber Shinobi', 'Neon Valkyrie', 'Gamer Neko', 'Shadow Blade', 'Mecha Pilot',
    'Pixel Hero', 'Void Ranger', 'Thunder Ninja', 'Cosmic Sorceress', 'Solar Knight',
    'Astro Boy', 'Hyper Drift', 'Chibi Fox', 'Zero Samurai', 'Luminous Archon',
    'Blaze Swordsman', 'Iron Paladin', 'Phantom Assassin', 'Titan Brawler', 'Storm Lancer',
    'Apex Hunter', 'Venom Vanguard', 'Omega Trooper', 'Crimson Reaper', 'Vortex Warden',
    'Cyber Commander', 'Frost Guardian', 'Eclipse Templar', 'Rogue Gunner', 'Spectral Warrior',
    'Arcade King', 'Retro Hacker', 'Console Bandit', 'Joystick Champ', 'Cyber Punk',
    'Speed Demon', 'VR Explorer', '8-Bit Legend', 'Combo Master', 'Glitch Runner',
    'Esports Ace', 'Button Masher', 'Pixel Princess', 'Quest Knight', 'Level 99 Boss',
    'Star Prince', 'Mystic Neko', 'Golden Champion', 'Crown Regent', 'Divine Spirit',
    'Phoenix Mage', 'Kitsune Mask', 'Dragon Spirit', 'Luna Guardian', 'Galaxy Wanderer',
    'Demon Slayer', 'Angelic Blade', 'Rune Caster', 'Chrono Traveler', 'Infinite One',
  ];

  const name = names[i] || `Hero ${num}`;

  return {
    id,
    name,
    category,
    bg,
    skin,
    index: i + 1,
  };
});

// Render SVG markup string / component for a given avatarId
export function getAvatarById(avatarId) {
  return AVATARS.find((a) => a.id === avatarId) || AVATARS[0];
}

export function getRandomAvatar() {
  const randomIndex = Math.floor(Math.random() * AVATARS.length);
  return AVATARS[randomIndex];
}
