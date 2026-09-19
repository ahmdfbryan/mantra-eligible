const config = require('./config');

class RobloxApiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'RobloxApiError';
    this.code = code; // 'USER_NOT_FOUND' | 'NOT_MEMBER' | 'API_ERROR'
  }
}

/**
 * Cari user Roblox berdasarkan username (exact match).
 * Endpoint publik, tidak butuh API key.
 */
async function getUserByUsername(username) {
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });

  if (!res.ok) {
    throw new RobloxApiError(
      `Gagal menghubungi Roblox Users API (status ${res.status})`,
      'API_ERROR'
    );
  }

  const json = await res.json();
  const user = json?.data?.[0];
  if (!user) {
    throw new RobloxApiError(`Username Roblox "${username}" tidak ditemukan.`, 'USER_NOT_FOUND');
  }

  return {
    id: user.id,
    username: user.name,
    displayName: user.displayName || user.name,
  };
}

/**
 * Ambil URL avatar headshot (kepala, bulat) resolusi tinggi. Endpoint publik.
 */
async function getAvatarHeadshotUrl(userId, size = '420x420') {
  const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=${size}&format=Png&isCircular=false`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const entry = json?.data?.[0];
  if (!entry || entry.state !== 'Completed') return null;
  return entry.imageUrl || null;
}

/**
 * Cari waktu pertama kali user bergabung ke grup, lewat Open Cloud v2
 * (List Group Memberships), difilter langsung ke user yang dicari.
 * Butuh ROBLOX_API_KEY dengan scope group:read pada group tsb.
 */
async function getGroupJoinDate(userId) {
  const groupId = config.robloxGroupId;
  const filter = encodeURIComponent(`user == 'users/${userId}'`);
  const url = `https://apis.roblox.com/cloud/v2/groups/${groupId}/memberships?maxPageSize=1&filter=${filter}`;

  const res = await fetch(url, {
    headers: { 'x-api-key': config.robloxApiKey },
  });

  if (res.status === 404) {
    throw new RobloxApiError('Group tidak ditemukan / API key tidak punya akses.', 'API_ERROR');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new RobloxApiError(
      `Gagal menghubungi Roblox Group API (status ${res.status}). ${body}`.trim(),
      'API_ERROR'
    );
  }

  const json = await res.json();

  // Nama field array pada respons Open Cloud v2 bisa berbeda tergantung versi API,
  // jadi dicoba beberapa kemungkinan supaya tetap robust.
  const list =
    json.groupMemberships || json.memberships || json.data || (Array.isArray(json) ? json : []);

  const membership = Array.isArray(list) ? list[0] : null;

  if (!membership) {
    throw new RobloxApiError('User ini belum/bukan anggota komunitas.', 'NOT_MEMBER');
  }

  const createTime =
    membership.createTime || membership.createdTime || membership.joinTime || membership.create_time;

  if (!createTime) {
    throw new RobloxApiError(
      'Data membership ditemukan tapi field tanggal bergabung tidak dikenali. Cek format respons API.',
      'API_ERROR'
    );
  }

  return new Date(createTime);
}

/**
 * Gabungan: resolve username -> avatar + tanggal join grup.
 */
async function lookupMember(username) {
  const user = await getUserByUsername(username);
  const [avatarUrl, joinedAt] = await Promise.all([
    getAvatarHeadshotUrl(user.id).catch(() => null),
    getGroupJoinDate(user.id),
  ]);

  return {
    ...user,
    avatarUrl,
    joinedAt,
    profileUrl: `https://www.roblox.com/users/${user.id}/profile`,
  };
}

module.exports = {
  RobloxApiError,
  getUserByUsername,
  getAvatarHeadshotUrl,
  getGroupJoinDate,
  lookupMember,
};
