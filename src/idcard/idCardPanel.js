const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

const BTN_CREATE_ID = 'idcard_create';
const BTN_VIEW_ID = 'idcard_view';

const MODAL_ID = 'idcard_modal';
const MODAL_NAMA_ID = 'idcard_modal_nama';
const MODAL_GENDER_ID = 'idcard_modal_gender';
const MODAL_DOMISILI_ID = 'idcard_modal_domisili';
const MODAL_CITACITA_ID = 'idcard_modal_citacita';
const MODAL_HOBI_ID = 'idcard_modal_hobi';

const COLOR_PINK = 0xff2f9c;

function buildIdCardPanelEmbed(communityName) {
  return new EmbedBuilder()
    .setColor(COLOR_PINK)
    .setTitle('🪪  MEMBER ID CARD')
    .setDescription(
      'Buat ID Card digital kamu sebagai member komunitas ini. Isinya nama, data diri singkat, foto profil, tanggal join, dan **Level** kamu (naik otomatis tiap aktif chat di server).\n\n' +
        '**🪪 Buat ID** -- isi/update data diri kamu\n' +
        '**🔍 Lihat ID Saya** -- tampilkan ID Card kamu yang sudah dibuat'
    )
    .setFooter({ text: communityName || 'MANTRA CREATIVE' })
    .setTimestamp(new Date());
}

function buildIdCardPanelComponents() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(BTN_CREATE_ID).setLabel('Buat ID').setEmoji('🪪').setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(BTN_VIEW_ID)
      .setLabel('Lihat ID Saya')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Secondary)
  );
}

/**
 * Modal isi data diri buat ID Card. Kalau `existing` diisi (member sudah
 * pernah buat ID sebelumnya), field-nya di-prefill pakai data lama supaya
 * gampang di-edit, bukan mulai dari kosong lagi.
 */
function buildIdCardModal(existing) {
  const namaInput = new TextInputBuilder()
    .setCustomId(MODAL_NAMA_ID)
    .setLabel('Nama')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Nama kamu')
    .setMaxLength(40)
    .setRequired(true);
  if (existing?.nama) namaInput.setValue(existing.nama);

  const genderInput = new TextInputBuilder()
    .setCustomId(MODAL_GENDER_ID)
    .setLabel('Jenis Kelamin')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Laki-laki / Perempuan')
    .setMaxLength(20)
    .setRequired(true);
  if (existing?.jenisKelamin) genderInput.setValue(existing.jenisKelamin);

  const domisiliInput = new TextInputBuilder()
    .setCustomId(MODAL_DOMISILI_ID)
    .setLabel('Domisili')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Kota tempat tinggal (opsional isi apa saja)')
    .setMaxLength(60)
    .setRequired(true);
  if (existing?.domisili) domisiliInput.setValue(existing.domisili);

  const citaCitaInput = new TextInputBuilder()
    .setCustomId(MODAL_CITACITA_ID)
    .setLabel('Cita-cita')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Contoh: CEO, Developer, dll')
    .setMaxLength(60)
    .setRequired(true);
  if (existing?.citaCita) citaCitaInput.setValue(existing.citaCita);

  const hobiInput = new TextInputBuilder()
    .setCustomId(MODAL_HOBI_ID)
    .setLabel('Hobi')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Apa yang kamu sukai')
    .setMaxLength(60)
    .setRequired(true);
  if (existing?.hobi) hobiInput.setValue(existing.hobi);

  return new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle(existing ? 'Update ID Card' : 'Buat ID Card')
    .addComponents(
      new ActionRowBuilder().addComponents(namaInput),
      new ActionRowBuilder().addComponents(genderInput),
      new ActionRowBuilder().addComponents(domisiliInput),
      new ActionRowBuilder().addComponents(citaCitaInput),
      new ActionRowBuilder().addComponents(hobiInput)
    );
}

module.exports = {
  BTN_CREATE_ID,
  BTN_VIEW_ID,
  MODAL_ID,
  MODAL_NAMA_ID,
  MODAL_GENDER_ID,
  MODAL_DOMISILI_ID,
  MODAL_CITACITA_ID,
  MODAL_HOBI_ID,
  buildIdCardPanelEmbed,
  buildIdCardPanelComponents,
  buildIdCardModal,
};
