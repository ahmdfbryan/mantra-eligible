// Isi teks Rules -- dipisah dari rulesPanel.js (yang urusannya bikin
// EmbedBuilder/komponen) supaya kontennya gampang diedit tanpa harus
// ngoprek logic. Ada 2 bahasa: id (default, dikirim duluan) dan en (muncul
// kalau tombol "Versi Bahasa Inggris" diklik).
//
// Tiap aturan punya `bullets` (array kalimat pendek, bukan 1 paragraf
// panjang) supaya pas dirender jadi bullet list ala referensi, bukan blok
// teks nyambung.

const WELCOME_TEXT = {
  id: {
    title: 'Welcome to Mantra Creative',
    body:
      '> Ahoy, Sobat Mantra!\n' +
      '> Kami sangat senang menyambut kamu di Mantra Creative, tempat berkumpulnya komunitas untuk terhubung, berbagi cerita, menjalin pertemanan, dan menciptakan pengalaman seru bersama.\n\n' +
      'Sebelum mulai berinteraksi dan bersenang-senang bersama, pastikan kamu sudah membaca serta memahami seluruh peraturan yang berlaku. Mari bersama-sama menjaga Mantra Creative tetap menjadi komunitas yang aman, nyaman, dan menyenangkan untuk semua!',
  },
  en: {
    title: 'Welcome to Mantra Creative',
    body:
      '> Ahoy, Sobat Mantra!\n' +
      "> We're super happy to welcome you to Mantra Creative -- a community built for connecting, sharing stories, making friends, and creating fun experiences together.\n\n" +
      "Before you start interacting and having fun with everyone, please make sure you've read and understood all the rules below. Let's work together to keep Mantra Creative a safe, comfortable, and enjoyable community for everyone!",
  },
};

// Baris kecil di atas judul besar embed Rules (dipasang lewat setAuthor).
const RULES_AUTHOR = {
  id: '📜 Peraturan Server',
  en: '📜 Server Rules',
};

// Judul besar embed Rules (dipasang lewat setTitle) -- diisi nama komunitas
// pas dirender, lihat rulesPanel.js.
const RULES_TITLE_TEMPLATE = {
  id: (name) => `Aturan di ${name}`,
  en: (name) => `Rules of ${name}`,
};

const RULES_INTRO = {
  id: 'Wajib dibaca dan dipatuhi oleh seluruh member tanpa terkecuali.',
  en: 'Required reading for every member -- no exceptions.',
};

const RULES_NOTE = {
  id: 'Rules dapat diperbarui sewaktu-waktu untuk menjaga komunitas ini tetap aman, nyaman, dan menyenangkan untuk semua.',
  en: 'These rules may be updated at any time to keep this community a safe, comfortable, and enjoyable place for everyone.',
};

const RULES = [
  {
    id: {
      title: 'Saling Menghargai',
      bullets: [
        'Perlakukan semua member dengan baik, penuh rasa hormat, empati, dan toleransi.',
        'No harassment, bullying, provokasi, atau penghinaan terhadap member lain -- baik secara langsung, lewat DM, maupun sindiran di channel publik.',
        'Perbedaan pendapat itu wajar, sampaikan dengan cara yang dewasa tanpa menyerang pribadi seseorang.',
      ],
    },
    en: {
      title: 'Mutual Respect',
      bullets: [
        'Treat every member kindly, with respect, empathy, and tolerance.',
        'No harassment, bullying, provocation, or insults toward other members -- whether direct, through DMs, or passive-aggressive remarks in public channels.',
        "Disagreements happen, just keep them civil and never attack someone personally.",
      ],
    },
  },
  {
    id: {
      title: 'Gunakan Channel Sesuai Fungsinya',
      bullets: [
        'Setiap channel punya fungsinya masing-masing -- posting sesuai tempatnya ya.',
        'Supaya server tetap rapi, mudah diikuti, dan nyaman dipakai seluruh member.',
        'Masih ragu channel mana yang cocok? Tanya saja ke Admin atau cek deskripsi channel-nya.',
      ],
    },
    en: {
      title: 'Use Channels Properly',
      bullets: [
        'Every channel has its own purpose -- post in the one it actually belongs to.',
        'Keeps the server organized, easy to follow, and pleasant for everyone.',
        "Not sure which channel fits? Ask an Admin or check the channel description first.",
      ],
    },
  },
  {
    id: {
      title: 'No Spam & Flood',
      bullets: [
        'Hindari mengirim pesan berulang-ulang atau yang tidak diinginkan.',
        'Jangan mention berlebihan ke member/role lain, spam sticker, maupun emoji.',
        'Flooding bikin channel susah dibaca dan mengganggu member lain yang butuh info penting.',
      ],
    },
    en: {
      title: 'No Spam & Flood',
      bullets: [
        'Avoid sending repeated or unwanted messages.',
        "Don't over-mention members/roles, or spam stickers and emojis.",
        'Flooding makes channels hard to follow and gets in the way of members who need important info.',
      ],
    },
  },
  {
    id: {
      title: 'No Scam & Phishing',
      bullets: [
        'Dilarang keras menyebarkan link scam, phishing, atau fake giveaway dalam bentuk apa pun.',
        'Jangan membagikan tautan mencurigakan, baik lewat pesan, DM, maupun status.',
        'Pelanggaran ini serius karena bisa merugikan member lain secara finansial maupun data pribadi.',
      ],
    },
    en: {
      title: 'No Scam & Phishing',
      bullets: [
        'Sharing scam links, phishing attempts, or fake giveaways is strictly forbidden.',
        "Don't share suspicious links through messages, DMs, or status updates.",
        'Treated as a serious violation since it can financially harm others or expose their personal data.',
      ],
    },
  },
  {
    id: {
      title: 'No Unapproved Promotion',
      bullets: [
        'Promosi server lain, produk, jasa, atau akun media sosial tidak diperbolehkan tanpa izin.',
        'Hubungi Admin dulu kalau ada sesuatu yang ingin kamu promosikan di server.',
        'Promosi tanpa izin akan dihapus dan bisa berujung sanksi.',
      ],
    },
    en: {
      title: 'No Unapproved Promotion',
      bullets: [
        'Promoting other servers, products, services, or social accounts needs approval first.',
        "Got something to promote? Reach out to an Admin before sharing it.",
        'Unapproved promotion will be removed and may lead to further action.',
      ],
    },
  },
  {
    id: {
      title: 'Keep It Appropriate',
      bullets: [
        'Konten NSFW, seksual, gore, atau kekerasan eksplisit sama sekali tidak diperbolehkan.',
        'Berlaku di channel manapun, tanpa pengecualian.',
        'Mantra Creative terbuka untuk berbagai kalangan, mari jaga suasana tetap nyaman untuk semua.',
      ],
    },
    en: {
      title: 'Keep It Appropriate',
      bullets: [
        'NSFW content, sexual content, gore, or explicit violence is not allowed at all.',
        'Applies to every channel, no exceptions.',
        "This community is open to all kinds of people, so let's keep it comfortable for everyone.",
      ],
    },
  },
  {
    id: {
      title: 'Fair Play',
      bullets: [
        'Dilarang menggunakan exploit, cheat, script berbahaya, atau bug abuse.',
        'Cara curang apa pun yang merusak pengalaman bermain member lain tidak ditoleransi.',
        'Semua orang berhak menikmati pengalaman yang sama dan adil.',
      ],
    },
    en: {
      title: 'Fair Play',
      bullets: [
        'Using exploits, cheats, malicious scripts, or bug abuse is not allowed.',
        "Any unfair method that ruins other members' experience will not be tolerated.",
        'Everyone deserves an equal, fair experience.',
      ],
    },
  },
  {
    id: {
      title: 'Respect Admin',
      bullets: [
        'Hormati keputusan yang diambil tim Admin -- dibuat demi kenyamanan bersama.',
        'Kalau merasa ada keputusan yang kurang tepat, sampaikan baik-baik lewat ticket/DM.',
        'Hindari debat terbuka soal keputusan Admin di channel publik.',
      ],
    },
    en: {
      title: 'Respect Admin',
      bullets: [
        'Respect decisions made by the Admin team -- they exist to keep things comfortable for everyone.',
        'Feel a decision was unfair? Raise it politely through a ticket or DM.',
        "Avoid public arguments about Admin decisions in a channel.",
      ],
    },
  },
  {
    id: {
      title: 'Jaga Privasi',
      bullets: [
        'Jangan membagikan informasi pribadi milikmu sendiri maupun orang lain tanpa izin.',
        'Termasuk nomor telepon, alamat, akun pribadi, atau data sensitif lainnya.',
        'Privasi itu penting -- komunitas ini berkomitmen menjaga keamanan seluruh membernya.',
      ],
    },
    en: {
      title: 'Protect Privacy',
      bullets: [
        "Don't share personal information -- yours or anyone else's -- without consent.",
        'Includes phone numbers, addresses, personal accounts, or other sensitive data.',
        "Privacy matters -- this community is committed to keeping every member's info safe.",
      ],
    },
  },
  {
    id: {
      title: 'Use Common Sense',
      bullets: [
        'Tidak semua situasi bisa dituliskan satu per satu dalam rules ini.',
        'Kalau ragu, gunakan akal sehat: jika berpotensi merugikan atau mengganggu, jangan dilakukan.',
        'Masih ragu? Tanya dulu ke Admin sebelum bertindak.',
      ],
    },
    en: {
      title: 'Use Common Sense',
      bullets: [
        "Not every situation can be written down in these rules one by one.",
        "When in doubt, use common sense: if it could harm or disrupt others, don't do it.",
        'Still unsure? Ask an Admin first.',
      ],
    },
  },
  {
    id: {
      title: 'Enforcement',
      bullets: [
        'Pelanggaran ditindak sesuai tingkat keseriusannya.',
        'Mulai dari warning, mute, kick, hingga ban permanen.',
        'Tim Admin berhak mengambil tindakan yang dianggap perlu demi menjaga kenyamanan bersama.',
      ],
    },
    en: {
      title: 'Enforcement',
      bullets: [
        'Violations are handled according to their severity.',
        'Ranging from a warning, mute, or kick, up to a permanent ban.',
        'The Admin team reserves the right to take whatever action is deemed necessary.',
      ],
    },
  },
];

module.exports = { WELCOME_TEXT, RULES_AUTHOR, RULES_TITLE_TEMPLATE, RULES_INTRO, RULES_NOTE, RULES };
