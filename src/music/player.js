const { Readable } = require('stream');
const { spawn } = require('child_process');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  StreamType,
  NoSubscriberBehavior,
} = require('@discordjs/voice');

// State per guild (in-memory -- reset kalau bot restart, konsisten dengan
// music bot pada umumnya; yang penting koneksi voice-nya sendiri otomatis
// nyambung lagi & balik ke channel yang di-set lewat konfigurasi).
const guildStates = new Map();

/**
 * Streaming audio dari YouTube pakai binary `yt-dlp` (bukan library
 * ytdl-core) -- ytdl-core & fork-forknya sering gagal ("Failed to find any
 * playable formats") tiap YouTube ubah mekanisme internalnya, sedangkan
 * yt-dlp jauh lebih rutin di-update ngikutin perubahan itu. Wajib
 * terinstall di server (lihat README).
 */
function spawnYtDlpAudioStream(url) {
  const proc = spawn('yt-dlp', [url, '-f', 'bestaudio/best', '-o', '-', '--quiet', '--no-warnings', '--no-playlist']);

  proc.stderr.on('data', (chunk) => {
    console.error('[music] yt-dlp stderr:', chunk.toString().trim());
  });

  proc.on('error', (error) => {
    console.error(
      '[music] Gagal jalankan yt-dlp -- pastikan sudah terinstall di server (`yt-dlp --version`):',
      error.message
    );
  });

  return { stream: proc.stdout, process: proc };
}

/**
 * Ambil ID video YouTube dari berbagai bentuk URL (watch?v=, youtu.be/,
 * dst) -- dipakai buat nyusun URL "Mix/Radio" (`&list=RD<id>`) buat fitur
 * autoplay.
 */
function extractYoutubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1) || null;
    }
    const v = parsed.searchParams.get('v');
    if (v) return v;
  } catch {
    // URL tidak valid / bukan YouTube -- gak masalah, autoplay cuma dilewati
  }
  return null;
}

/**
 * Ambil satu rekomendasi lagu "senada" dari playlist Mix/Radio YouTube
 * (`&list=RD<videoId>`) buat fitur autoplay, pakai `yt-dlp --flat-playlist
 * --dump-json` (cuma ambil metadata ringan, tanpa download apa pun).
 * Non-fatal: balikin null kalau gagal/kosong, supaya autoplay gagal dengan
 * anggun (fallback ke silence) daripada bikin bot crash.
 */
function fetchAutoplayTrack(videoId, excludeIds) {
  return new Promise((resolve) => {
    const proc = spawn('yt-dlp', [
      `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`,
      '--flat-playlist',
      '--dump-json',
      '--playlist-end',
      '10',
      '--quiet',
      '--no-warnings',
    ]);

    let output = '';
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    proc.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    proc.stderr.on('data', () => {
      // diamkan -- yt-dlp suka nulis progress/warning ke stderr yang gak
      // relevan buat sekadar ambil metadata playlist
    });
    proc.on('error', (error) => {
      console.error('[music] Gagal jalankan yt-dlp buat autoplay:', error.message);
      finish(null);
    });
    proc.on('close', () => {
      const lines = output.split('\n').filter(Boolean);
      for (const line of lines) {
        let item;
        try {
          item = JSON.parse(line);
        } catch {
          continue; // baris bukan JSON valid, skip
        }
        const id = item?.id;
        if (!id || id === videoId || excludeIds.has(id)) continue;
        finish({
          title: item.title || 'Lagu rekomendasi',
          url: `https://www.youtube.com/watch?v=${id}`,
          durationText: null,
          durationSec: null,
          thumbnail: item.thumbnails?.[0]?.url || item.thumbnail || null,
          sourceLabel: 'Autoplay',
        });
        return;
      }
      finish(null);
    });

    // Jaga-jaga kalau yt-dlp nyangkut/lama banget -- jangan sampai autoplay
    // bikin lagu berikutnya nunggu selamanya.
    setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        // sudah selesai/mati, aman diabaikan
      }
      finish(null);
    }, 15_000);
  });
}

function killActiveProcess(state) {
  if (state.activeProcess) {
    try {
      state.activeProcess.kill('SIGKILL');
    } catch {
      // proses sudah mati, aman diabaikan
    }
    state.activeProcess = null;
  }
}

function getState(guildId) {
  return guildStates.get(guildId) || null;
}

function ensureState(guildId) {
  let state = guildStates.get(guildId);
  if (!state) {
    state = {
      connection: null,
      audioPlayer: null,
      queue: [],
      current: null, // track yang SEDANG diputar (bukan silence filler)
      lastPlayed: null, // track terakhir yang beneran diputar (buat basis rekomendasi autoplay)
      recentAutoplayIds: new Set(), // video ID yang baru saja direkomendasikan (hindari ulang-ulang lagu yang sama)
      autoplay: false,
      volume: 1,
      voiceChannelId: null,
      activeProcess: null, // proses yt-dlp yang sedang jalan (buat di-kill kalau skip/stop)
      onStateChange: null, // dipanggil tiap kali status berubah (buat refresh panel)
    };
    guildStates.set(guildId, state);
  }
  return state;
}

function notify(state) {
  if (typeof state.onStateChange === 'function') {
    try {
      state.onStateChange();
    } catch (error) {
      console.error('[music] Gagal jalankan onStateChange callback:', error);
    }
  }
}

/**
 * Silent PCM filler (16-bit stereo 48kHz) yang diputar terus-menerus saat
 * tidak ada antrian, supaya bot tetap "aktif" di voice channel dan tidak
 * kena idle-timeout / pindah otomatis ke AFK channel oleh Discord.
 * Ini pure Node (raw PCM), tidak butuh ffmpeg atau file audio tambahan.
 */
function createSilentAudioStream() {
  // 20ms frame @ 48kHz, 16-bit, stereo = 48000 * 2(bytes) * 2(channel) * 0.02s
  const frame = Buffer.alloc(3840);
  return new Readable({
    read() {
      this.push(frame);
    },
  });
}

function playSilence(state) {
  const resource = createAudioResource(createSilentAudioStream(), {
    inputType: StreamType.Raw,
  });
  state.current = null;
  state.audioPlayer.play(resource);
}

/**
 * Konek (atau pindah) ke voice channel tertentu, lalu langsung mulai filler
 * silence supaya bot langsung "nempel" walau belum ada yang di-play.
 */
async function connect(voiceChannel) {
  const guildId = voiceChannel.guild.id;
  const state = ensureState(guildId);

  if (state.connection && state.connection.state.status !== VoiceConnectionStatus.Destroyed) {
    if (state.voiceChannelId === voiceChannel.id) {
      return state; // sudah konek ke channel yang sama
    }
    state.connection.destroy();
    state.connection = null;
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  state.connection = connection;
  state.voiceChannelId = voiceChannel.id;

  // WAJIB ada listener 'error' di sini -- VoiceConnection adalah EventEmitter,
  // dan di Node.js event 'error' TANPA listener bikin exception-nya jadi
  // uncaught lalu proses langsung mati total (bot restart terus-menerus
  // tanpa stack trace yang kecatat di log). Ini penyebab crash-loop yang
  // sebelumnya terjadi tiap kali bot auto-join voice channel.
  connection.on('error', (error) => {
    console.error(`[music] Voice connection error di guild ${guildId}:`, error);
  });

  if (!state.audioPlayer) {
    state.audioPlayer = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });

    state.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      const s = getState(guildId);
      if (!s) return;
      s.current = null;
      playNext(guildId).catch((error) =>
        console.error('[music] Gagal proses lagu berikutnya (idle):', error)
      );
    });

    state.audioPlayer.on('error', (error) => {
      console.error('[music] Audio player error:', error);
      const s = getState(guildId);
      if (!s) return;
      s.current = null;
      playNext(guildId).catch((err) =>
        console.error('[music] Gagal proses lagu berikutnya (error):', err)
      );
    });
  }

  connection.subscribe(state.audioPlayer);

  // Auto-reconnect kalau ke-disconnect (network glitch, voice server pindah,
  // dsb) -- ini yang bikin bot beneran "24/7", bukan cuma sekali konek.
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      // discord.js akan coba reconnect otomatis di sini.
    } catch {
      try {
        connection.destroy();
      } catch {
        // sudah destroyed, aman diabaikan
      }
      const s = getState(guildId);
      if (s) s.connection = null;
      setTimeout(() => {
        rejoinChannel(voiceChannel.guild, voiceChannel.id).catch((error) =>
          console.error('[music] Gagal rejoin voice channel setelah disconnect:', error)
        );
      }, 5_000);
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    const s = getState(guildId);
    if (s && s.connection === connection) {
      s.connection = null;
    }
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch (error) {
    connection.destroy();
    throw new Error(`Gagal konek ke voice channel: ${error.message}`);
  }

  if (state.queue.length > 0 && !state.current) {
    playNext(guildId).catch((error) => console.error('[music] Gagal mulai antrian setelah konek:', error));
  } else {
    playSilence(state);
  }

  notify(state);
  return state;
}

async function rejoinChannel(guild, voiceChannelId) {
  if (!voiceChannelId) return;
  const channel = await guild.channels.fetch(voiceChannelId).catch(() => null);
  if (!channel || typeof channel.isVoiceBased !== 'function' || !channel.isVoiceBased()) return;
  await connect(channel);
}

function enqueue(guild, track) {
  const state = ensureState(guild.id);
  state.queue.push(track);
  if (!state.current && state.audioPlayer) {
    playNext(guild.id).catch((error) => console.error('[music] Gagal mulai lagu dari antrian baru:', error));
  } else {
    notify(state);
  }
  return state.queue.length;
}

/**
 * Mainkan lagu berikutnya dari antrian. Kalau antrian kosong dan autoplay
 * aktif, coba cari rekomendasi lagu "senada" dari lagu terakhir yang
 * diputar (via YouTube Mix/Radio) sebelum jatuh ke silence filler.
 */
async function playNext(guildId) {
  const state = getState(guildId);
  if (!state || !state.audioPlayer) return;

  killActiveProcess(state);

  let next = state.queue.shift();

  if (!next && state.autoplay && state.lastPlayed) {
    const videoId = extractYoutubeId(state.lastPlayed.url);
    if (videoId) {
      try {
        const recommended = await fetchAutoplayTrack(videoId, state.recentAutoplayIds);
        if (recommended) {
          next = recommended;
          state.recentAutoplayIds.add(videoId);
          if (state.recentAutoplayIds.size > 20) {
            const ids = [...state.recentAutoplayIds];
            state.recentAutoplayIds = new Set(ids.slice(ids.length - 20));
          }
        } else {
          console.log('[music] Autoplay: tidak ada rekomendasi lagu ditemukan.');
        }
      } catch (error) {
        console.error('[music] Gagal ambil rekomendasi autoplay:', error);
      }
    }
  }

  // State bisa saja sudah dihapus/berubah selama proses fetch autoplay di
  // atas (misalnya guild kosong bot keluar) -- cek ulang sebelum lanjut.
  const freshState = getState(guildId);
  if (!freshState || !freshState.audioPlayer) return;

  if (!next) {
    playSilence(freshState);
    notify(freshState);
    return;
  }

  try {
    const { stream, process } = spawnYtDlpAudioStream(next.url);
    freshState.activeProcess = process;

    stream.on('error', (error) => {
      console.error(`[music] Stream error buat "${next.title}":`, error.message);
    });

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    });
    resource.volume?.setVolume(freshState.volume);

    freshState.audioPlayer.play(resource);
    freshState.current = next;
    freshState.lastPlayed = next;
  } catch (error) {
    console.error('[music] Gagal mulai play track, coba lagu berikutnya:', error);
    freshState.current = null;
    playNext(guildId).catch((err) => console.error('[music] Gagal lanjut ke lagu berikutnya:', err));
    return;
  }

  notify(freshState);
}

function skip(guildId) {
  const state = getState(guildId);
  if (!state?.audioPlayer || !state.current) return false;
  state.audioPlayer.stop(); // trigger Idle -> playNext (antrian, autoplay, atau silence)
  return true;
}

function stopAndClear(guildId) {
  const state = getState(guildId);
  if (!state) return false;
  state.queue = [];
  // Reset lastPlayed supaya Stop beneran berhenti (tidak langsung disambung
  // lagi sama autoplay walau autoplay-nya masih ON) -- autoplay akan lanjut
  // lagi otomatis begitu ada track baru yang diputar setelah ini.
  state.lastPlayed = null;
  killActiveProcess(state);
  if (state.audioPlayer) state.audioPlayer.stop(); // -> Idle -> playSilence
  return true;
}

function togglePause(guildId) {
  const state = getState(guildId);
  if (!state?.audioPlayer || !state.current) return null; // gak ada track asli yg sedang main
  if (state.audioPlayer.state.status === AudioPlayerStatus.Playing) {
    state.audioPlayer.pause();
    notify(state);
    return 'paused';
  }
  if (state.audioPlayer.state.status === AudioPlayerStatus.Paused) {
    state.audioPlayer.unpause();
    notify(state);
    return 'resumed';
  }
  return null;
}

function setVolume(guildId, volume) {
  const state = getState(guildId);
  if (!state) return false;
  state.volume = Math.max(0, Math.min(2, volume));
  const resource = state.audioPlayer?.state?.resource;
  if (resource?.volume) resource.volume.setVolume(state.volume);
  notify(state);
  return true;
}

function isPaused(guildId) {
  const state = getState(guildId);
  return state?.audioPlayer?.state?.status === AudioPlayerStatus.Paused;
}

/**
 * Nyala/matikan autoplay buat guild ini. Saat antrian kosong & autoplay
 * aktif, bot otomatis nyambung ke lagu "senada" dari lagu terakhir yang
 * diputar (mirip fitur "Autoplay" di Spotify/YouTube Music).
 */
function setAutoplay(guildId, enabled) {
  const state = ensureState(guildId);
  state.autoplay = Boolean(enabled);
  notify(state);
  return state.autoplay;
}

function toggleAutoplay(guildId) {
  const state = ensureState(guildId);
  return setAutoplay(guildId, !state.autoplay);
}

function isAutoplay(guildId) {
  const state = getState(guildId);
  return Boolean(state?.autoplay);
}

function onStateChange(guildId, callback) {
  const state = ensureState(guildId);
  state.onStateChange = callback;
}

module.exports = {
  connect,
  rejoinChannel,
  enqueue,
  skip,
  stopAndClear,
  togglePause,
  setVolume,
  isPaused,
  setAutoplay,
  toggleAutoplay,
  isAutoplay,
  getState,
  onStateChange,
};
