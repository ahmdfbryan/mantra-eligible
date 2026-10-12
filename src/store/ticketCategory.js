const { ChannelType } = require('discord.js');
const config = require('../config');
const ticketStore = require('./ticketStore');

const MAX_CHANNELS_PER_CATEGORY = 50; // limit resmi Discord per category

/**
 * Cari category ticket yang masih ada slot-nya (< 50 channel), atau bikin
 * category baru kalau semua sudah penuh / belum ada sama sekali. ID
 * category yang pernah dibuat disimpan di store-tickets.json supaya tidak
 * bikin category baru terus tiap restart bot.
 */
async function getOrCreateTicketCategory(guild) {
  const categoryIds = ticketStore.getCategories();

  for (const catId of categoryIds) {
    const cat = await guild.channels.fetch(catId).catch(() => null);
    if (!cat || cat.type !== ChannelType.GuildCategory) continue;
    const childCount = guild.channels.cache.filter((c) => c.parentId === catId).size;
    if (childCount < MAX_CHANNELS_PER_CATEGORY) return cat;
  }

  const index = categoryIds.length + 1;
  const name = index === 1 ? config.store.ticketCategoryPrefix : `${config.store.ticketCategoryPrefix} ${index}`;
  const newCategory = await guild.channels.create({ name, type: ChannelType.GuildCategory });
  ticketStore.addCategory(newCategory.id);
  return newCategory;
}

module.exports = { getOrCreateTicketCategory, MAX_CHANNELS_PER_CATEGORY };
