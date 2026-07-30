// ============================================================
// ANIME CHARACTER AVATAR SYSTEM LIBRARY (70+ ICONIC ANIME CHARACTERS)
// Categories: Naruto, One Piece, Attack On Titan, Demon Slayer, Jujutsu Kaisen, Death Note, Haikyuu, Mixed Anime
// ============================================================

export const AVATAR_CATEGORIES = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'naruto', name: 'Naruto', icon: '🍥' },
  { id: 'onepiece', name: 'One Piece', icon: '☠️' },
  { id: 'aot', name: 'AOT', icon: '⚔️' },
  { id: 'ds', name: 'Demon Slayer', icon: '🔥' },
  { id: 'jjk', name: 'JJK', icon: '✨' },
  { id: 'deathnote', name: 'Death Note', icon: '🖤' },
  { id: 'haikyuu', name: 'Haikyuu', icon: '🏐' },
  { id: 'mixed', name: 'Mixed Anime', icon: '🎮' },
  { id: 'favorites', name: 'Favorites', icon: '⭐' },
];

export const DEFAULT_AVATAR_ID = 'avatar_naruto_01';

export const ANIME_AVATARS = [
  // 🍥 Naruto
  { id: 'avatar_naruto_01', name: 'Naruto Uzumaki', anime: 'Naruto', category: 'naruto', bg: ['#FF8000', '#FFCC00'], hair: '#FFD700', skin: '#FFE0BD', detail: 'headband' },
  { id: 'avatar_sasuke_02', name: 'Sasuke Uchiha', anime: 'Naruto', category: 'naruto', bg: ['#1E1B4B', '#4338CA'], hair: '#1E293B', skin: '#F5C6A5', detail: 'sharingan' },
  { id: 'avatar_itachi_03', name: 'Itachi Uchiha', anime: 'Naruto', category: 'naruto', bg: ['#450A0A', '#991B1B'], hair: '#0F172A', skin: '#F5C6A5', detail: 'akatsuki' },
  { id: 'avatar_kakashi_04', name: 'Kakashi Hatake', anime: 'Naruto', category: 'naruto', bg: ['#1F2937', '#4B5563'], hair: '#E2E8F0', skin: '#F5C6A5', detail: 'mask' },
  { id: 'avatar_minato_05', name: 'Minato Namikaze', anime: 'Naruto', category: 'naruto', bg: ['#D97706', '#F59E0B'], hair: '#FACC15', skin: '#FFE0BD', detail: 'hokage' },
  { id: 'avatar_madara_06', name: 'Madara Uchiha', anime: 'Naruto', category: 'naruto', bg: ['#581C87', '#7E22CE'], hair: '#09090B', skin: '#E2E8F0', detail: 'rinnegan' },
  { id: 'avatar_obito_07', name: 'Obito Uchiha', anime: 'Naruto', category: 'naruto', bg: ['#C2410C', '#EA580C'], hair: '#18181B', skin: '#F5C6A5', detail: 'orange_mask' },
  { id: 'avatar_pain_08', name: 'Pain (Nagato)', anime: 'Naruto', category: 'naruto', bg: ['#7C2D12', '#C2410C'], hair: '#F97316', skin: '#E2E8F0', detail: 'piercings' },
  { id: 'avatar_jiraiya_09', name: 'Jiraiya', anime: 'Naruto', category: 'naruto', bg: ['#991B1B', '#DC2626'], hair: '#F8FAFC', skin: '#F5C6A5', detail: 'sage' },
  { id: 'avatar_shikamaru_10', name: 'Shikamaru Nara', anime: 'Naruto', category: 'naruto', bg: ['#065F46', '#059669'], hair: '#18181B', skin: '#F5C6A5', detail: 'ponytail' },

  // ☠️ One Piece
  { id: 'avatar_luffy_01', name: 'Monkey D. Luffy', anime: 'One Piece', category: 'onepiece', bg: ['#B91C1C', '#EF4444'], hair: '#09090B', skin: '#FFE0BD', detail: 'straw_hat' },
  { id: 'avatar_zoro_02', name: 'Roronoa Zoro', anime: 'One Piece', category: 'onepiece', bg: ['#064E3B', '#10B981'], hair: '#22C55E', skin: '#F5C6A5', detail: 'eye_scar' },
  { id: 'avatar_sanji_03', name: 'Vinsmoke Sanji', anime: 'One Piece', category: 'onepiece', bg: ['#1E3A8A', '#3B82F6'], hair: '#FACC15', skin: '#FFE0BD', detail: 'curly_brow' },
  { id: 'avatar_ace_04', name: 'Portgas D. Ace', anime: 'One Piece', category: 'onepiece', bg: ['#C2410C', '#F97316'], hair: '#09090B', skin: '#F5C6A5', detail: 'fire_hat' },
  { id: 'avatar_shanks_05', name: 'Red-Haired Shanks', anime: 'One Piece', category: 'onepiece', bg: ['#7F1D1D', '#B91C1C'], hair: '#EF4444', skin: '#F5C6A5', detail: 'shanks_scar' },
  { id: 'avatar_law_06', name: 'Trafalgar D. Law', anime: 'One Piece', category: 'onepiece', bg: ['#312E81', '#4F46E5'], hair: '#18181B', skin: '#E2E8F0', detail: 'spotted_hat' },
  { id: 'avatar_nami_07', name: 'Nami', anime: 'One Piece', category: 'onepiece', bg: ['#C2410C', '#F97316'], hair: '#FB923C', skin: '#FFE0BD', detail: 'orange_hair' },
  { id: 'avatar_robin_08', name: 'Nico Robin', anime: 'One Piece', category: 'onepiece', bg: ['#4C1D95', '#7C3AED'], hair: '#09090B', skin: '#F5C6A5', detail: 'purple_glasses' },
  { id: 'avatar_usopp_09', name: 'Usopp', anime: 'One Piece', category: 'onepiece', bg: ['#854D0E', '#CA8A04'], hair: '#18181B', skin: '#D97706', detail: 'bandana' },
  { id: 'avatar_chopper_10', name: 'Tony Chopper', anime: 'One Piece', category: 'onepiece', bg: ['#BE185D', '#EC4899'], hair: '#78350F', skin: '#F5C6A5', detail: 'pink_hat' },

  // ⚔️ Attack On Titan
  { id: 'avatar_levi_01', name: 'Levi Ackerman', anime: 'Attack On Titan', category: 'aot', bg: ['#111827', '#374151'], hair: '#09090B', skin: '#F1F5F9', detail: 'cravat' },
  { id: 'avatar_eren_02', name: 'Eren Yeager', anime: 'Attack On Titan', category: 'aot', bg: ['#065F46', '#047857'], hair: '#451A03', skin: '#F5C6A5', detail: 'titan_eyes' },
  { id: 'avatar_mikasa_03', name: 'Mikasa Ackerman', anime: 'Attack On Titan', category: 'aot', bg: ['#881337', '#BE123C'], hair: '#09090B', skin: '#F8FAFC', detail: 'red_scarf' },
  { id: 'avatar_armin_04', name: 'Armin Arlert', anime: 'Attack On Titan', category: 'aot', bg: ['#A16207', '#EAB308'], hair: '#FDE047', skin: '#FFE0BD', detail: 'scout_cape' },
  { id: 'avatar_erwin_05', name: 'Erwin Smith', anime: 'Attack On Titan', category: 'aot', bg: ['#1E3A8A', '#2563EB'], hair: '#FACC15', skin: '#F5C6A5', detail: 'commander_tie' },
  { id: 'avatar_reiner_06', name: 'Reiner Braun', anime: 'Attack On Titan', category: 'aot', bg: ['#78350F', '#B45309'], hair: '#FDE047', skin: '#F5C6A5', detail: 'armored' },
  { id: 'avatar_sasha_07', name: 'Sasha Blouse', anime: 'Attack On Titan', category: 'aot', bg: ['#15803D', '#22C55E'], hair: '#78350F', skin: '#FFE0BD', detail: 'potato' },

  // 🔥 Demon Slayer
  { id: 'avatar_tanjiro_01', name: 'Tanjiro Kamado', anime: 'Demon Slayer', category: 'ds', bg: ['#047857', '#10B981'], hair: '#881337', skin: '#F5C6A5', detail: 'hanafuda' },
  { id: 'avatar_nezuko_02', name: 'Nezuko Kamado', anime: 'Demon Slayer', category: 'ds', bg: ['#831843', '#DB2777'], hair: '#09090B', skin: '#FFF1F2', detail: 'bamboo' },
  { id: 'avatar_zenitsu_03', name: 'Zenitsu Agatsuma', anime: 'Demon Slayer', category: 'ds', bg: ['#D97706', '#F59E0B'], hair: '#FACC15', skin: '#FFE0BD', detail: 'lightning_hair' },
  { id: 'avatar_inosuke_04', name: 'Inosuke Hashibira', anime: 'Demon Slayer', category: 'ds', bg: ['#1E3A8A', '#0284C7'], hair: '#78350F', skin: '#F5C6A5', detail: 'boar_mask' },
  { id: 'avatar_rengoku_05', name: 'Kyojuro Rengoku', anime: 'Demon Slayer', category: 'ds', bg: ['#991B1B', '#EF4444'], hair: '#FACC15', skin: '#F5C6A5', detail: 'flame_eyes' },
  { id: 'avatar_giyu_06', name: 'Giyu Tomioka', anime: 'Demon Slayer', category: 'ds', bg: ['#1E1B4B', '#3730A3'], hair: '#09090B', skin: '#F1F5F9', detail: 'water_haori' },
  { id: 'avatar_shinobu_07', name: 'Shinobu Kocho', anime: 'Demon Slayer', category: 'ds', bg: ['#581C87', '#9333EA'], hair: '#312E81', skin: '#FFF1F2', detail: 'butterfly' },

  // ✨ Jujutsu Kaisen
  { id: 'avatar_gojo_01', name: 'Gojo Satoru', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#0284C7', '#38BDF8'], hair: '#F8FAFC', skin: '#F8FAFC', detail: 'blindfold' },
  { id: 'avatar_sukuna_02', name: 'Ryomen Sukuna', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#881337', '#E11D48'], hair: '#F43F5E', skin: '#F5C6A5', detail: 'sukuna_tattoos' },
  { id: 'avatar_toji_03', name: 'Toji Fushiguro', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#18181B', '#3F3F46'], hair: '#09090B', skin: '#F5C6A5', detail: 'lip_scar' },
  { id: 'avatar_geto_04', name: 'Suguru Geto', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#312E81', '#6366F1'], hair: '#09090B', skin: '#F5C6A5', detail: 'head_stitch' },
  { id: 'avatar_yuta_05', name: 'Yuta Okkotsu', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#0F172A', '#334155'], hair: '#1E293B', skin: '#F8FAFC', detail: 'ring_pendant' },
  { id: 'avatar_megumi_06', name: 'Megumi Fushiguro', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#1E1B4B', '#4338CA'], hair: '#09090B', skin: '#F5C6A5', detail: 'shadow_spikes' },
  { id: 'avatar_nobara_07', name: 'Nobara Kugisaki', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#9A3412', '#EA580C'], hair: '#D97706', skin: '#FFE0BD', detail: 'hammer_nail' },
  { id: 'avatar_nanami_08', name: 'Kento Nanami', anime: 'Jujutsu Kaisen', category: 'jjk', bg: ['#854D0E', '#CA8A04'], hair: '#FACC15', skin: '#F5C6A5', detail: 'nanami_glasses' },

  // 🖤 Death Note
  { id: 'avatar_light_01', name: 'Light Yagami', anime: 'Death Note', category: 'deathnote', bg: ['#450A0A', '#7F1D1D'], hair: '#B45309', skin: '#F5C6A5', detail: 'red_smirk' },
  { id: 'avatar_l_02', name: 'L Lawliet', anime: 'Death Note', category: 'deathnote', bg: ['#09090B', '#27272A'], hair: '#09090B', skin: '#F8FAFC', detail: 'eye_circles' },
  { id: 'avatar_ryuk_03', name: 'Ryuk', anime: 'Death Note', category: 'deathnote', bg: ['#2E1065', '#581C87'], hair: '#09090B', skin: '#E2E8F0', detail: 'ryuk_eyes' },
  { id: 'avatar_misa_04', name: 'Misa Amane', anime: 'Death Note', category: 'deathnote', bg: ['#701A75', '#A21CAF'], hair: '#FACC15', skin: '#FFF1F2', detail: 'goth_twintails' },

  // 🏐 Haikyuu
  { id: 'avatar_hinata_01', name: 'Shoyo Hinata', anime: 'Haikyuu', category: 'haikyuu', bg: ['#C2410C', '#EA580C'], hair: '#F97316', skin: '#FFE0BD', detail: 'volleyball' },
  { id: 'avatar_kageyama_02', name: 'Tobio Kageyama', anime: 'Haikyuu', category: 'haikyuu', bg: ['#0F172A', '#1E293B'], hair: '#09090B', skin: '#F5C6A5', detail: 'king_crown' },
  { id: 'avatar_oikawa_03', name: 'Toru Oikawa', anime: 'Haikyuu', category: 'haikyuu', bg: ['#0F766E', '#0D9488'], hair: '#78350F', skin: '#F5C6A5', detail: 'setter_crown' },
  { id: 'avatar_bokuto_04', name: 'Kotaro Bokuto', anime: 'Haikyuu', category: 'haikyuu', bg: ['#374151', '#6B7280'], hair: '#F8FAFC', skin: '#F5C6A5', detail: 'owl_hair' },
  { id: 'avatar_kuroo_05', name: 'Tetsuro Kuroo', anime: 'Haikyuu', category: 'haikyuu', bg: ['#991B1B', '#DC2626'], hair: '#09090B', skin: '#F5C6A5', detail: 'bedhead' },
  { id: 'avatar_nishinoya_06', name: 'Yu Nishinoya', anime: 'Haikyuu', category: 'haikyuu', bg: ['#B45309', '#F59E0B'], hair: '#18181B', skin: '#FFE0BD', detail: 'orange_tuft' },

  // 🎮 Mixed Anime
  { id: 'avatar_goku_01', name: 'Son Goku', anime: 'Dragon Ball Z', category: 'mixed', bg: ['#C2410C', '#EF4444'], hair: '#09090B', skin: '#FFE0BD', detail: 'dbz_spikes' },
  { id: 'avatar_vegeta_02', name: 'Prince Vegeta', anime: 'Dragon Ball Z', category: 'mixed', bg: ['#1E3A8A', '#3B82F6'], hair: '#09090B', skin: '#F5C6A5', detail: 'widows_peak' },
  { id: 'avatar_killua_03', name: 'Killua Zoldyck', anime: 'Hunter x Hunter', category: 'mixed', bg: ['#1E1B4B', '#4F46E5'], hair: '#F8FAFC', skin: '#F8FAFC', detail: 'lightning_aura' },
  { id: 'avatar_gon_04', name: 'Gon Freecss', anime: 'Hunter x Hunter', category: 'mixed', bg: ['#15803D', '#22C55E'], hair: '#09090B', skin: '#FFE0BD', detail: 'tall_spikes' },
  { id: 'avatar_jinwoo_05', name: 'Sung Jin-Woo', anime: 'Solo Leveling', category: 'mixed', bg: ['#09090B', '#312E81'], hair: '#09090B', skin: '#F8FAFC', detail: 'monarch_eyes' },
  { id: 'avatar_denji_06', name: 'Denji', anime: 'Chainsaw Man', category: 'mixed', bg: ['#991B1B', '#F97316'], hair: '#FACC15', skin: '#F5C6A5', detail: 'chainsaw_pull' },
  { id: 'avatar_deku_07', name: 'Izuku Midoriya', anime: 'My Hero Academia', category: 'mixed', bg: ['#047857', '#10B981'], hair: '#065F46', skin: '#FFE0BD', detail: 'freckles' },
  { id: 'avatar_bakugo_08', name: 'Katsuki Bakugo', anime: 'My Hero Academia', category: 'mixed', bg: ['#C2410C', '#F59E0B'], hair: '#FEF08A', skin: '#F5C6A5', detail: 'explosion_spikes' },
  { id: 'avatar_saitama_09', name: 'Saitama', anime: 'One Punch Man', category: 'mixed', bg: ['#D97706', '#EAB308'], hair: '#FFE0BD', skin: '#FFE0BD', detail: 'bald_hero' },
  { id: 'avatar_mob_10', name: 'Shigeo Kageyama (Mob)', anime: 'Mob Psycho 100', category: 'mixed', bg: ['#4C1D95', '#8B5CF6'], hair: '#09090B', skin: '#F8FAFC', detail: 'mob_bowlcut' },
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
