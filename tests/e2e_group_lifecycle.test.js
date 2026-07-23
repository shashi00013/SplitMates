import { prisma } from '../backend/src/utils/prisma.js';

const API_URL = 'http://127.0.0.1:5000/api';

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 STARTING E2E AUTH & GROUP LIFECYCLE AUTOMATED TEST');
  console.log('====================================================\n');

  const ts = Date.now();
  const emailA = `usera_${ts}@test.com`;
  const emailB = `userb_${ts}@test.com`;
  const password = 'Password123!';

  // Step 1: User A registers & logs in
  console.log('1️⃣ Registering & logging in User A...');
  const regARes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: emailA, password }),
  });
  const regAData = await regARes.json();
  if (!regARes.ok || !regAData.token) {
    throw new Error(`User A registration failed: ${JSON.stringify(regAData)}`);
  }
  const tokenA = regAData.token;
  const userA = regAData.user;
  console.log(`   ✅ User A registered successfully: ${userA.id} (${userA.email})`);

  // Step 2: User A creates a group
  console.log('\n2️⃣ User A creating a new group...');
  const createRes = await fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ name: 'Alpha Squad', description: 'Testing E2E Group Lifecycle', icon: '🚀' }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.group?.id) {
    throw new Error(`Group creation failed: ${JSON.stringify(createData)}`);
  }
  const group = createData.group;
  const inviteCode = group.inviteCode;
  console.log(`   ✅ Group created successfully! ID: ${group.id}, Invite Code: ${inviteCode}`);

  // Step 3: Verify group exists in PostgreSQL via Prisma
  console.log('\n3️⃣ Verifying group existence in PostgreSQL...');
  const dbGroup = await prisma.group.findUnique({
    where: { id: group.id },
    include: { members: true },
  });
  if (!dbGroup) {
    throw new Error(`Group ${group.id} not found in PostgreSQL!`);
  }
  console.log(`   ✅ Verified in PostgreSQL! Name: "${dbGroup.name}", Member Count: ${dbGroup.members.length}`);

  // Step 4: User B registers & logs in
  console.log('\n4️⃣ Registering & logging in User B...');
  const regBRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: emailB, password }),
  });
  const regBData = await regBRes.json();
  if (!regBRes.ok || !regBData.token) {
    throw new Error(`User B registration failed: ${JSON.stringify(regBData)}`);
  }
  const tokenB = regBData.token;
  const userB = regBData.user;
  console.log(`   ✅ User B registered successfully: ${userB.id} (${userB.email})`);

  // Step 5: User B joins group using User A's invite code
  console.log('\n5️⃣ User B joining group via invite code...');
  const joinRes = await fetch(`${API_URL}/groups/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ inviteCode }),
  });
  const joinData = await joinRes.json();
  if (!joinRes.ok || !joinData.group?.id) {
    throw new Error(`User B failed to join group: ${JSON.stringify(joinData)}`);
  }
  console.log(`   ✅ User B joined group successfully! Returned Member Count: ${joinData.group.members.length}`);

  // Step 6: Verify both users are members in PostgreSQL
  console.log('\n6️⃣ Verifying membership in PostgreSQL...');
  const dbMembers = await prisma.groupMember.findMany({
    where: { groupId: group.id },
    include: { user: true },
  });
  const memberUserIds = dbMembers.map((m) => m.userId);
  if (!memberUserIds.includes(userA.id) || !memberUserIds.includes(userB.id)) {
    throw new Error(`PostgreSQL membership check failed! Found members: ${JSON.stringify(memberUserIds)}`);
  }
  console.log(`   ✅ Verified! Both User A (${userA.name}) and User B (${userB.name}) are members in PostgreSQL.`);

  // Step 7 & 8: Perform hydration (GET /api/groups) for both users
  console.log('\n7️⃣ & 8️⃣ Testing GET /api/groups hydration for both users...');

  const groupsARes = await fetch(`${API_URL}/groups`, {
    headers: { 'Authorization': `Bearer ${tokenA}` },
  });
  const groupsAData = await groupsARes.json();
  const hasGroupA = (groupsAData.groups || []).some((g) => g.id === group.id);

  const groupsBRes = await fetch(`${API_URL}/groups`, {
    headers: { 'Authorization': `Bearer ${tokenB}` },
  });
  const groupsBData = await groupsBRes.json();
  const hasGroupB = (groupsBData.groups || []).some((g) => g.id === group.id);

  if (!hasGroupA) throw new Error('User A GET /groups did not contain created group!');
  if (!hasGroupB) throw new Error('User B GET /groups did not contain joined group!');
  console.log('   ✅ GET /groups hydration verified for both User A and User B!');

  // Step 9 & 10: Test invalid invite code error handling
  console.log('\n9️⃣ & 🔟 Testing invalid invite code error response...');
  const badJoinRes = await fetch(`${API_URL}/groups/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ inviteCode: 'INVALID' }),
  });
  const badJoinData = await badJoinRes.json();
  if (badJoinRes.status !== 404 || !badJoinData.message) {
    throw new Error(`Expected 404 error for invalid invite code, got: ${badJoinRes.status} ${JSON.stringify(badJoinData)}`);
  }
  console.log(`   ✅ Invalid invite code properly rejected with HTTP 404: "${badJoinData.message}"`);

  console.log('\n====================================================');
  console.log('🎉 ALL 10 E2E AUTOMATED LIFECYCLE TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runE2ETests()
  .catch((err) => {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
