// ============================================================
// REAL ANIME CHARACTER AVATAR GALLERY DATASET
// Official IDs matching requested character names:
// gojo_satoru, sukuna, itachi_uchiha, kakashi_hatake, naruto_uzumaki,
// sasuke_uchiha, madara_uchiha, levi_ackerman, eren_yeager, mikasa_ackerman,
// luffy, zoro, sanji, ace, shanks, tanjiro, rengoku, giyu, zenitsu, light_yagami, l_lawliet, hinata_shoyo, kageyama_tobio
// ============================================================

export const AVATAR_CATEGORIES = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'jjk', name: 'Jujutsu Kaisen', icon: '✨' },
  { id: 'naruto', name: 'Naruto', icon: '🍥' },
  { id: 'aot', name: 'Attack On Titan', icon: '⚔️' },
  { id: 'onepiece', name: 'One Piece', icon: '☠️' },
  { id: 'ds', name: 'Demon Slayer', icon: '🔥' },
  { id: 'deathnote', name: 'Death Note', icon: '🖤' },
  { id: 'haikyuu', name: 'Haikyuu', icon: '🏐' },
  { id: 'favorites', name: 'Favorites', icon: '⭐' },
];

export const DEFAULT_AVATAR_ID = 'naruto_uzumaki';

export const ANIME_AVATARS = [
  // ✨ Jujutsu Kaisen
  {
    id: 'gojo_satoru',
    name: 'Gojo Satoru',
    anime: 'Jujutsu Kaisen',
    category: 'jjk',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png',
    bg: ['#0284C7', '#38BDF8'],
    color: '#0284C7'
  },
  {
    id: 'sukuna',
    name: 'Ryomen Sukuna',
    anime: 'Jujutsu Kaisen',
    category: 'jjk',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b133701-rCQuDpHr3UZL.png',
    bg: ['#881337', '#E11D48'],
    color: '#E11D48'
  },

  // 🍥 Naruto
  {
    id: 'itachi_uchiha',
    name: 'Itachi Uchiha',
    anime: 'Naruto',
    category: 'naruto',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b14-9Kb1E5oel1ke.png',
    bg: ['#450A0A', '#991B1B'],
    color: '#991B1B'
  },
  {
    id: 'kakashi_hatake',
    name: 'Kakashi Hatake',
    anime: 'Naruto',
    category: 'naruto',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b85-mkVBh2yjxjmx.png',
    bg: ['#1F2937', '#4B5563'],
    color: '#4B5563'
  },
  {
    id: 'naruto_uzumaki',
    name: 'Naruto Uzumaki',
    anime: 'Naruto',
    category: 'naruto',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b17-phjcWCkRuIhu.png',
    bg: ['#FF8000', '#FFCC00'],
    color: '#FF8000'
  },
  {
    id: 'sasuke_uchiha',
    name: 'Sasuke Uchiha',
    anime: 'Naruto',
    category: 'naruto',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b13-SISLEw1oAD7a.png',
    bg: ['#1E1B4B', '#4338CA'],
    color: '#4338CA'
  },
  {
    id: 'madara_uchiha',
    name: 'Madara Uchiha',
    anime: 'Naruto',
    category: 'naruto',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b53901-HnRKSoHMG5Vg.png',
    bg: ['#581C87', '#7E22CE'],
    color: '#7E22CE'
  },

  // ⚔️ Attack On Titan
  {
    id: 'levi_ackerman',
    name: 'Levi Ackerman',
    anime: 'Attack On Titan',
    category: 'aot',
    imageUrl: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/levi-ackerman-shingeki-no-kyojin-attack-on-titan-poster-artwork-transparent.png',
    bg: ['#111827', '#374151'],
    color: '#374151'
  },
  {
    id: 'eren_yeager',
    name: 'Eren Yeager',
    anime: 'Attack On Titan',
    category: 'aot',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b40882-dsj7IP943WFF.jpg',
    bg: ['#065F46', '#047857'],
    color: '#047857'
  },
  {
    id: 'mikasa_ackerman',
    name: 'Mikasa Ackerman',
    anime: 'Attack On Titan',
    category: 'aot',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b40881-F3gr1PkreDvj.png',
    bg: ['#881337', '#BE123C'],
    color: '#BE123C'
  },

  // ☠️ One Piece
  {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    anime: 'One Piece',
    category: 'onepiece',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b40-MNypXsxSRb1R.png',
    bg: ['#B91C1C', '#EF4444'],
    color: '#EF4444'
  },
  {
    id: 'zoro',
    name: 'Roronoa Zoro',
    anime: 'One Piece',
    category: 'onepiece',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b62-S7oAeA9WInjV.png',
    bg: ['#064E3B', '#10B981'],
    color: '#10B981'
  },
  {
    id: 'sanji',
    name: 'Vinsmoke Sanji',
    anime: 'One Piece',
    category: 'onepiece',
    imageUrl: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/sanji-one-piece-anime-artwork-transparent.png',
    bg: ['#1E3A8A', '#3B82F6'],
    color: '#3B82F6'
  },
  {
    id: 'ace',
    name: 'Portgas D. Ace',
    anime: 'One Piece',
    category: 'onepiece',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b2072-Lc6jEdsueJUK.jpg',
    bg: ['#C2410C', '#F97316'],
    color: '#F97316'
  },
  {
    id: 'shanks',
    name: 'Red-Haired Shanks',
    anime: 'One Piece',
    category: 'onepiece',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b727-wUJx7M1z5xON.png',
    bg: ['#7F1D1D', '#B91C1C'],
    color: '#B91C1C'
  },

  // 🔥 Demon Slayer
  {
    id: 'tanjiro',
    name: 'Tanjiro Kamado',
    anime: 'Demon Slayer',
    category: 'ds',
    imageUrl: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/tanjiro-kamado-demon-slayer-kimetsu-no-yaiba-transparent.png',
    bg: ['#047857', '#10B981'],
    color: '#10B981'
  },
  {
    id: 'rengoku',
    name: 'Kyojuro Rengoku',
    anime: 'Demon Slayer',
    category: 'ds',
    imageUrl: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/kyojuro-rengoku-demon-slayer-mugen-train-transparent.png',
    bg: ['#991B1B', '#EF4444'],
    color: '#EF4444'
  },
  {
    id: 'giyu',
    name: 'Giyu Tomioka',
    anime: 'Demon Slayer',
    category: 'ds',
    imageUrl: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/giyu-tomioka-demon-slayer-water-hashira-transparent.png',
    bg: ['#1E1B4B', '#3730A3'],
    color: '#3730A3'
  },
  {
    id: 'zenitsu',
    name: 'Zenitsu Agatsuma',
    anime: 'Demon Slayer',
    category: 'ds',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b129131-FZrQ7lSlxmEr.png',
    bg: ['#D97706', '#F59E0B'],
    color: '#F59E0B'
  },

  // 🖤 Death Note
  {
    id: 'light_yagami',
    name: 'Light Yagami',
    anime: 'Death Note',
    category: 'deathnote',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b80-26EhwSsSqQ50.png',
    bg: ['#450A0A', '#7F1D1D'],
    color: '#7F1D1D'
  },
  {
    id: 'l_lawliet',
    name: 'L Lawliet',
    anime: 'Death Note',
    category: 'deathnote',
    imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b71-1W4panC53vfs.png',
    bg: ['#09090B', '#27272A'],
    color: '#27272A'
  },

  // 🏐 Haikyuu
  {
    id: 'hinata_shoyo',
    name: 'Shoyo Hinata',
    anime: 'Haikyuu',
    category: 'haikyuu',
    imageUrl: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/shoyo-hinata-haikyuu-karasuno-transparent.png',
    bg: ['#C2410C', '#EA580C'],
    color: '#EA580C'
  },
  {
    id: 'kageyama_tobio',
    name: 'Tobio Kageyama',
    anime: 'Haikyuu',
    category: 'haikyuu',
    imageUrl: 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/tobio-kageyama-haikyuu-karasuno-transparent.png',
    bg: ['#0F172A', '#1E293B'],
    color: '#1E293B'
  }
];

export function getAvatarById(avatarId) {
  if (!avatarId) return ANIME_AVATARS[0];
  const found = ANIME_AVATARS.find((a) => a.id === avatarId);
  return found || ANIME_AVATARS[0];
}

export function getRandomAvatar() {
  const randomIndex = Math.floor(Math.random() * ANIME_AVATARS.length);
  return ANIME_AVATARS[randomIndex];
}
