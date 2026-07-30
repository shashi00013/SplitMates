// ============================================================
// CENTRALIZED MOCK DATA
// All data is independent of any reference design.
// Dates are generated dynamically relative to today.
// Replace this with real backend data later.
// ============================================================

// ---- Date helpers (relative to NOW) ----
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysAgoISO(n, hour = 14, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}


// ============================================================
// MOCK AUTHENTICATED USER
// Replace with real JWT auth later
// ============================================================
export const currentUser = {
  id: "user-1",
  name: "Arjun Mehra",
  firstName: "Arjun",
  email: "arjun.mehra@email.com",
  phone: "+91 90123 45678",
  avatar: "avatar_naruto_01",
  avatarId: "avatar_naruto_01",
  color: "#CCFF00",
  joinedAt: "2025-03-10",
};

// ============================================================
// ALL USERS
// ============================================================
export const allUsers = [
  currentUser,
  { id: "user-2", name: "Vikram Joshi", firstName: "Vikram", email: "vikram.joshi@email.com", color: "#FF6B6B", avatar: "avatar_gojo_01", avatarId: "avatar_gojo_01" },
  { id: "user-3", name: "Sneha Nair", firstName: "Sneha", email: "sneha.nair@email.com", color: "#4ECDC4", avatar: "avatar_luffy_01", avatarId: "avatar_luffy_01" },
  { id: "user-4", name: "Devika Rao", firstName: "Devika", email: "devika.rao@email.com", color: "#FFE66D", avatar: "avatar_levi_01", avatarId: "avatar_levi_01" },
  { id: "user-5", name: "Rohan Pillai", firstName: "Rohan", email: "rohan.pillai@email.com", color: "#A78BFA", avatar: "avatar_tanjiro_01", avatarId: "avatar_tanjiro_01" },
  { id: "user-6", name: "Tara Desai", firstName: "Tara", email: "tara.desai@email.com", color: "#F472B6", avatar: "avatar_light_01", avatarId: "avatar_light_01" },
];

// ============================================================
// GROUPS
// ============================================================
export const initialGroups = [
  {
    id: "group-1",
    name: "Apartment 4B",
    icon: "🏠",
    description: "Shared apartment bills",
    createdBy: "user-1",
    memberIds: ["user-1", "user-2", "user-3", "user-4"],
    createdAt: "2025-04-01",
  },
  {
    id: "group-2",
    name: "Goa Beach Trip",
    icon: "🏖️",
    description: "Summer beach getaway",
    createdBy: "user-2",
    memberIds: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"],
    createdAt: "2025-06-20",
  },
  {
    id: "group-3",
    name: "Office Lunch Crew",
    icon: "🍱",
    description: "Daily office lunches",
    createdBy: "user-1",
    memberIds: ["user-1", "user-2", "user-5", "user-3", "user-6"],
    createdAt: "2025-05-15",
  },
];

// ============================================================
// EXPENSE CYCLES
// ============================================================
export const initialCycles = [
  {
    id: "cycle-group-1-1",
    groupId: "group-1",
    startDate: daysAgoISO(60, 10, 0),
    endDate: daysAgoISO(20, 19, 15),
    status: "completed",
    settlementId: "settle-h1",
  },
  {
    id: "cycle-group-1-2",
    groupId: "group-1",
    startDate: daysAgoISO(20, 19, 16),
    endDate: null,
    status: "active",
    settlementId: null,
  },
  {
    id: "cycle-group-2-1",
    groupId: "group-2",
    startDate: daysAgoISO(30, 9, 0),
    endDate: null,
    status: "active",
    settlementId: null,
  },
  {
    id: "cycle-group-3-1",
    groupId: "group-3",
    startDate: daysAgoISO(75, 11, 0),
    endDate: daysAgoISO(35, 13, 30),
    status: "completed",
    settlementId: "settle-h2",
  },
  {
    id: "cycle-group-3-2",
    groupId: "group-3",
    startDate: daysAgoISO(35, 13, 31),
    endDate: null,
    status: "active",
    settlementId: null,
  },
];

// ============================================================
// EXPENSES  (dates relative to today)
// ============================================================
export const initialExpenses = [
  // --- Historical Expenses (Completed Cycles) ---
  { id: "exp-h1", groupId: "group-1", cycleId: "cycle-group-1-1", title: "Move-in Deposit", emoji: "🔑", amount: 4000, paidBy: "user-1", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(25), settled: true, settlementId: "settle-h1" },
  { id: "exp-h2", groupId: "group-1", cycleId: "cycle-group-1-1", title: "Furniture & Rugs", emoji: "🛋️", amount: 1620, paidBy: "user-3", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(22), settled: true, settlementId: "settle-h1" },

  // --- Apartment 4B (Active Cycle) ---
  { id: "exp-1", groupId: "group-1", cycleId: "cycle-group-1-2", title: "Weekly Groceries", emoji: "🛒", amount: 1850, paidBy: "user-2", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(0) },
  { id: "exp-2", groupId: "group-1", cycleId: "cycle-group-1-2", title: "Wi-Fi Recharge", emoji: "🌐", amount: 999, paidBy: "user-1", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(2) },
  { id: "exp-3", groupId: "group-1", cycleId: "cycle-group-1-2", title: "Power Bill — June", emoji: "⚡", amount: 2140, paidBy: "user-3", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(4) },
  { id: "exp-4", groupId: "group-1", cycleId: "cycle-group-1-2", title: "Pizza Night", emoji: "🍕", amount: 1320, paidBy: "user-1", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(5) },
  { id: "exp-5", groupId: "group-1", cycleId: "cycle-group-1-2", title: "Cleaning Supplies", emoji: "🧹", amount: 475, paidBy: "user-4", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(7) },
  { id: "exp-6", groupId: "group-1", cycleId: "cycle-group-1-2", title: "Netflix Subscription", emoji: "🎬", amount: 649, paidBy: "user-2", splitAmong: ["user-1", "user-2", "user-3", "user-4"], splitType: "equal", date: daysAgo(9) },

  // --- Goa Beach Trip (Active Cycle) ---
  { id: "exp-7", groupId: "group-2", cycleId: "cycle-group-2-1", title: "Flight Tickets", emoji: "✈️", amount: 7200, paidBy: "user-1", splitAmong: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"], splitType: "equal", date: daysAgo(14) },
  { id: "exp-8", groupId: "group-2", cycleId: "cycle-group-2-1", title: "Resort Booking", emoji: "🏨", amount: 12800, paidBy: "user-2", splitAmong: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"], splitType: "equal", date: daysAgo(13) },
  { id: "exp-9", groupId: "group-2", cycleId: "cycle-group-2-1", title: "Scuba Diving", emoji: "🤿", amount: 4500, paidBy: "user-1", splitAmong: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"], splitType: "equal", date: daysAgo(12) },
  { id: "exp-10", groupId: "group-2", cycleId: "cycle-group-2-1", title: "Beachside Dinner", emoji: "🍽️", amount: 3650, paidBy: "user-5", splitAmong: ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6"], splitType: "equal", date: daysAgo(11) },

  // --- Office Lunch Crew (Active Cycle) ---
  { id: "exp-11", groupId: "group-3", cycleId: "cycle-group-3-2", title: "Thai Takeout", emoji: "🍜", amount: 1100, paidBy: "user-1", splitAmong: ["user-1", "user-2", "user-5", "user-3", "user-6"], splitType: "equal", date: daysAgo(1) },
  { id: "exp-12", groupId: "group-3", cycleId: "cycle-group-3-2", title: "Escape Room Outing", emoji: "🔐", amount: 2500, paidBy: "user-5", splitAmong: ["user-1", "user-2", "user-5", "user-3", "user-6"], splitType: "equal", date: daysAgo(8) },
  { id: "exp-13", groupId: "group-3", cycleId: "cycle-group-3-2", title: "Farewell Cake", emoji: "🎂", amount: 1750, paidBy: "user-1", splitAmong: ["user-1", "user-2", "user-5", "user-3", "user-6"], splitType: "equal", date: daysAgo(10) },
  { id: "exp-14", groupId: "group-3", cycleId: "cycle-group-3-2", title: "Coffee & Snacks", emoji: "☕", amount: 780, paidBy: "user-3", splitAmong: ["user-1", "user-2", "user-5", "user-3", "user-6"], splitType: "equal", date: daysAgo(6) },
];

// ============================================================
// SETTLEMENT HISTORY
// ============================================================
export const initialSettlementHistory = [
  {
    id: "settle-h1",
    groupId: "group-1",
    cycleId: "cycle-group-1-1",
    completedAt: daysAgoISO(20, 19, 15),
    completedBy: "user-1",
    confirmations: ["user-1", "user-2", "user-3", "user-4"],
    transactions: [
      { from: "user-2", to: "user-1", amount: 1420.00 },
      { from: "user-4", to: "user-3", amount: 1390.00 },
    ],
    totalSettled: 5620.00,
    balancesBeforeSettlement: {
      "user-1": 1420.00,
      "user-2": -1420.00,
      "user-3": 1390.00,
      "user-4": -1390.00,
    },
    status: "completed",
  },
  {
    id: "settle-h2",
    groupId: "group-3",
    cycleId: "cycle-group-3-1",
    completedAt: daysAgoISO(35, 13, 30),
    completedBy: "user-1",
    confirmations: ["user-1", "user-2", "user-3", "user-5", "user-6"],
    transactions: [
      { from: "user-5", to: "user-1", amount: 1725.00 },
      { from: "user-2", to: "user-3", amount: 1725.00 },
    ],
    totalSettled: 3450.00,
    balancesBeforeSettlement: {
      "user-1": 1725.00,
      "user-2": -1725.00,
      "user-3": 1725.00,
      "user-5": -1725.00,
      "user-6": 0,
    },
    status: "completed",
  },
];

// ============================================================
// HELPERS
// ============================================================
export function getUserById(id) {
  return allUsers.find((u) => u.id === id) || null;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  // Normalise both to midnight local time for accurate day comparison
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const dateMidnight = new Date(date);
  dateMidnight.setHours(0, 0, 0, 0);

  const diffMs = todayMidnight - dateMidnight;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays <= 13) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

