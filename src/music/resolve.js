const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const spotifyUrlInfo = require('spotify-url-info');

// spotify-url-info butuh fetch agent -- Node 18+ sudah punya global fetch,
// jadi tinggal pakai itu (tidak perlu install isomorphic-unfetch dsb).
const spotify = spotifyUrlInfo(fetch);

const YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/i;
const SPOTIFY_URL_REGEX = /open\.spotify\.com\/(track|album|playlist)\//i;

/**
 * Cari 1 video paling relevan di YouTube untuk query text bebas.
 */
async function searchYoutube(query) {
  const result = await yts(query);
  const video = result?.videos?.[0];
  if (!video) return null;

  return {
    title: video.title,
    url: video.url,
    durationText: video.timestamp || video.duration?.timestamp || null,
    durationSec: video.seconds ?? video.duration?.seconds ?? null,
    thumbnail: video.thumbnail || video.image || null,
  };
}

/**
 * Resolve 1 query (link YouTube, link Spotify, atau keyword bebas) jadi 1
 * track yang siap diputar (selalu berujung ke URL YouTube, karena Spotify
 * API publik tidak menyediakan streaming full track -- cuma metadata).
 * @returns {Promise<{title, url, durationText, durationSec, thumbnail, sourceLabel}>}
 */
async function resolveTrack(query) {
  const trimmed = query.trim();

  if (SPOTIFY_URL_REGEX.test(trimmed)) {
    const preview = await spotify.getPreview(trimmed).catch((error) => {
      throw new Error(`Gagal ambil info dari link Spotify: ${error.message}`);
    });

    const trackName = preview.track || preview.title;
    const searchQuery = [trackName, preview.artist].filter(Boolean).join(' ');
    if (!searchQuery) {
      throw new Error('Tidak bisa baca judul/artis dari link Spotify itu.');
    }

    const found = await searchYoutube(searchQuery);
    if (!found) {
      throw new Error(`Link Spotify terbaca ("${searchQuery}"), tapi tidak ketemu video YouTube yang cocok.`);
    }

    return { ...found, sourceLabel: `Spotify → YouTube (${searchQuery})` };
  }

  if (YOUTUBE_URL_REGEX.test(trimmed)) {
    const info = await ytdl.getBasicInfo(trimmed).catch((error) => {
      throw new Error(`Gagal ambil info video YouTube: ${error.message}`);
    });
    const details = info.videoDetails;
    const thumbnails = details.thumbnails || [];

    return {
      title: details.title,
      url: `https://www.youtube.com/watch?v=${details.videoId}`,
      durationText: null,
      durationSec: Number(details.lengthSeconds) || null,
      thumbnail: thumbnails[thumbnails.length - 1]?.url || null,
      sourceLabel: 'YouTube',
    };
  }

  // Keyword bebas -> cari di YouTube.
  const found = await searchYoutube(trimmed);
  if (!found) {
    throw new Error(`Tidak ketemu hasil YouTube untuk "${trimmed}".`);
  }
  return { ...found, sourceLabel: 'YouTube (hasil pencarian)' };
}

module.exports = { resolveTrack, searchYoutube };
