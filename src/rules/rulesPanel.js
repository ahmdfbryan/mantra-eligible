// Isi teks Rules -- dipisah dari rulesPanel.js (yang urusannya bikin
// EmbedBuilder/komponen) supaya kontennya gampang diedit tanpa harus
// ngoprek logic. Ada 2 bahasa: id (default, dikirim duluan) dan en (muncul
// kalau tombol "Versi Bahasa Inggris" diklik).

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

const RULES_TITLE = {
  id: '📜 Server Rules',
  en: '📜 Server Rules',
};

const RULES_INTRO = {
  id: 'Berikut peraturan resmi yang berlaku di **Mantra Creative**. Wajib dibaca dan dipatuhi oleh seluruh member tanpa terkecuali.',
  en: 'Here are the official rules of **Mantra Creative**. All members are required to read and follow them without exception.',
};

const RULES_NOTE = {
  id: 'Rules dapat diperbarui sewaktu-waktu untuk menjaga Mantra Creative tetap menjadi komunitas yang aman, nyaman, dan menyenangkan untuk semua.',
  en: 'These rules may be updated at any time to keep Mantra Creative a safe, comfortable, and enjoyable community for everyone.',
};

const RULES = [
  {
    id: {
      title: 'Saling Menghargai',
      body:
        'Setiap member di Mantra Creative berhak diperlakukan dengan hormat, apa pun latar belakang, pendapat, atau cara mereka bermain. Hindari segala bentuk harassment, bullying, provokasi, ejekan, maupun penghinaan terhadap member lain -- baik secara langsung, lewat DM, maupun sindiran di channel publik. Perbedaan pendapat itu wajar, sampaikan saja dengan cara yang dewasa dan tanpa menyerang pribadi seseorang.',
    },
    en: {
      title: 'Mutual Respect',
      body:
        'Every member of Mantra Creative deserves to be treated with respect, regardless of background, opinion, or play style. Avoid any form of harassment, bullying, provocation, or insults toward other members -- whether direct, through DMs, or passive-aggressive remarks in public channels. Disagreements happen, just keep them civil and never attack someone personally.',
    },
  },
  {
    id: {
      title: 'Gunakan Channel Sesuai Fungsinya',
      body:
        'Setiap channel di server ini dibuat dengan fungsinya masing-masing. Pastikan kamu posting pesan, gambar, pertanyaan, atau informasi di channel yang memang diperuntukkan untuk itu, supaya server tetap rapi, mudah diikuti, dan nyaman dipakai oleh seluruh member. Kalau ragu channel mana yang cocok, jangan sungkan bertanya ke Admin atau cek deskripsi channel-nya dulu.',
    },
    en: {
      title: 'Use Channels Properly',
      body:
        "Every channel here has its own specific purpose. Make sure you post messages, images, questions, or information in the channel they actually belong to, so the server stays organized and pleasant for everyone to use. If you're not sure which channel fits, feel free to ask an Admin or check the channel description first.",
    },
  },
  {
    id: {
      title: 'No Spam & Flood',
      body:
        'Hindari mengirim pesan berulang-ulang, mention berlebihan ke member atau role lain, spam sticker/emoji, maupun konten yang sengaja dibuat untuk mengganggu alur chat. Flooding bikin channel susah dibaca dan mengganggu kenyamanan member lain yang sedang ngobrol atau butuh informasi penting.',
    },
    en: {
      title: 'No Spam & Flood',
      body:
        "Avoid repeated messages, excessive mentions of members or roles, sticker/emoji spam, or any content made specifically to disrupt chat flow. Flooding makes channels hard to follow and gets in the way of members who are chatting or looking for important information.",
    },
  },
  {
    id: {
      title: 'No Scam & Phishing',
      body:
        'Dilarang keras menyebarkan link scam, phishing, fake giveaway, atau tautan mencurigakan dalam bentuk apa pun -- baik lewat pesan, DM, maupun status. Pelanggaran ini sangat serius karena bisa merugikan member lain secara finansial maupun data pribadi, dan akan ditindak tegas oleh tim Admin.',
    },
    en: {
      title: 'No Scam & Phishing',
      body:
        'Sharing scam links, phishing attempts, fake giveaways, or any suspicious links is strictly forbidden -- whether through messages, DMs, or status updates. This is treated as a serious violation since it can financially harm other members or compromise their personal data, and will be dealt with firmly by the Admin team.',
    },
  },
  {
    id: {
      title: 'No Unapproved Promotion',
      body:
        'Promosi server lain, produk, jasa, akun media sosial, atau layanan apa pun tidak diperbolehkan tanpa izin resmi dari staff terlebih dahulu. Kalau kamu punya sesuatu yang ingin dipromosikan, hubungi Admin dulu untuk mendapatkan persetujuan sebelum membagikannya di server.',
    },
    en: {
      title: 'No Unapproved Promotion',
      body:
        "Promoting other servers, products, services, or social media accounts is not allowed without official approval from staff. If there's something you'd like to promote, reach out to an Admin first to get permission before sharing it in the server.",
    },
  },
  {
    id: {
      title: 'Keep It Appropriate',
      body:
        'Konten NSFW, unsur seksual, gore, kekerasan eksplisit, maupun konten lain yang tidak pantas sama sekali tidak diperbolehkan di server ini, di channel manapun. Mantra Creative adalah komunitas yang terbuka untuk berbagai kalangan, jadi mari jaga suasana tetap nyaman dan aman untuk semua.',
    },
    en: {
      title: 'Keep It Appropriate',
      body:
        "NSFW content, sexual content, gore, explicit violence, or any other inappropriate material is not allowed anywhere in this server. Mantra Creative is a community open to all kinds of people, so let's keep the atmosphere safe and comfortable for everyone.",
    },
  },
  {
    id: {
      title: 'Fair Play',
      body:
        'Dilarang menggunakan exploit, cheat, script berbahaya, bug abuse, atau cara curang lainnya yang dapat merusak pengalaman bermain member lain. Mantra Creative menjunjung tinggi permainan yang adil -- semua orang berhak menikmati pengalaman yang sama tanpa dirugikan oleh kecurangan.',
    },
    en: {
      title: 'Fair Play',
      body:
        "Using exploits, cheats, malicious scripts, bug abuse, or any other unfair methods that ruin other members' experience is not allowed. Mantra Creative values fair play -- everyone deserves an equal experience without being disadvantaged by cheating.",
    },
  },
  {
    id: {
      title: 'Respect Admin',
      body:
        'Keputusan yang diambil oleh tim Admin dibuat demi menjaga kenyamanan bersama, jadi mohon dihormati. Kalau kamu merasa ada keputusan yang kurang tepat atau mengalami perlakuan yang tidak nyaman, sampaikan secara baik-baik lewat ticket/DM ke Admin, bukan lewat debat terbuka di channel publik.',
    },
    en: {
      title: 'Respect Admin',
      body:
        "Decisions made by the Admin team are meant to keep things comfortable for everyone, so please respect them. If you feel a decision was unfair or you've had an uncomfortable experience, raise it politely through a ticket or DM to an Admin, not through public arguments in a channel.",
    },
  },
  {
    id: {
      title: 'Jaga Privasi',
      body:
        'Jangan membagikan informasi pribadi -- baik milikmu sendiri maupun orang lain -- seperti nomor telepon, alamat, akun pribadi, atau data sensitif lainnya tanpa izin. Privasi adalah hal penting, dan Mantra Creative berkomitmen menjaga keamanan seluruh membernya.',
    },
    en: {
      title: 'Protect Privacy',
      body:
        "Don't share personal information -- yours or anyone else's -- such as phone numbers, addresses, personal accounts, or other sensitive data without consent. Privacy matters, and Mantra Creative is committed to keeping every member's information safe.",
    },
  },
  {
    id: {
      title: 'Use Common Sense',
      body:
        'Tidak semua situasi bisa dituliskan satu per satu dalam rules ini. Kalau kamu merasa ragu, gunakan akal sehat: jika sesuatu berpotensi merugikan, mengganggu, atau membuat member lain tidak nyaman, sebaiknya jangan dilakukan. Kalau masih ragu, tanya dulu ke Admin.',
    },
    en: {
      title: 'Use Common Sense',
      body:
        "Not every situation can be written down in these rules one by one. When in doubt, use common sense: if something could potentially harm, disrupt, or make other members uncomfortable, just don't do it. Still unsure? Ask an Admin first.",
    },
  },
  {
    id: {
      title: 'Enforcement',
      body:
        'Pelanggaran terhadap rules di atas akan ditindak sesuai tingkat keseriusannya, mulai dari warning, mute, kick, hingga ban permanen. Tim Admin berhak mengambil tindakan yang dianggap perlu demi menjaga Mantra Creative tetap menjadi tempat yang aman dan nyaman untuk semua.',
    },
    en: {
      title: 'Enforcement',
      body:
        'Violations of the rules above will be handled according to their severity, ranging from a warning, mute, or kick, up to a permanent ban. The Admin team reserves the right to take whatever action is deemed necessary to keep Mantra Creative a safe and comfortable place for everyone.',
    },
  },
];

module.exports = { WELCOME_TEXT, RULES_TITLE, RULES_INTRO, RULES_NOTE, RULES };
