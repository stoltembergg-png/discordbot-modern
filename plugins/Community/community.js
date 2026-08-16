const path = require("node:path");
const { JsonStore } = require("../../features/storage");
const { parseDuration, splitPipeArgs } = require("../../features/parsers");

const dataDirectory = process.env.DISCORD_BOT_DATA_DIR || path.join(process.cwd(), "data");
const store = new JsonStore(path.join(dataDirectory, "community.json"), {
  warnings: {},
  suggestions: {},
  reminders: {},
  settings: {},
});
const timers = new Map();

exports.commands = [
  "poll",
  "suggest",
  "remind",
  "warn",
  "warnings",
  "clearwarnings",
  "giveaway",
  "welcome",
  "tempvoice",
];

function isModerator(msg) {
  return Boolean(msg.member?.permissions?.has("KICK_MEMBERS"));
}

function guildId(msg) {
  return msg.guild?.id || "direct-message";
}

function scheduleReminder(reminder, bot) {
  if (timers.has(reminder.id)) clearTimeout(timers.get(reminder.id));
  const delay = Math.max(0, reminder.dueAt - Date.now());
  const timer = setTimeout(async () => {
    try {
      const channel = await bot.channels.fetch(reminder.channelId);
      await channel.send(`<@${reminder.userId}> ⏰ Lembrete: ${reminder.text}`);
    } catch (error) {
      console.error(`Unable to deliver reminder ${reminder.id}: ${error.message}`);
    } finally {
      store.update((state) => delete state.reminders[reminder.id]);
      timers.delete(reminder.id);
    }
  }, Math.min(delay, 2_147_000_000));
  timers.set(reminder.id, timer);
}

function addReaction(message, emoji) {
  return message.react(emoji).catch((error) => {
    console.error(`Unable to add reaction ${emoji}: ${error.message}`);
  });
}

exports.poll = {
  usage: "<pergunta> | <opção 1> | <opção 2> [| opção 3...]",
  description: "Cria uma enquete com reações.",
  process: async function (bot, msg, suffix) {
    const parts = splitPipeArgs(suffix, 3);
    if (!parts || parts.length > 11) {
      return msg.channel.send(`Uso: ${this.usage}`);
    }
    const [question, ...options] = parts;
    const labels = options.map((option, index) => `${String.fromCharCode(65 + index)} ${option}`);
    const sent = await msg.channel.send(`📊 **${question}**\n${labels.join("\n")}`);
    for (let index = 0; index < options.length; index += 1) {
      await addReaction(sent, `${String.fromCharCode(0x1f1e6 + index)}\u20e3`);
    }
  },
};

exports.suggest = {
  usage: "<sugestão>",
  description: "Publica uma sugestão para votação.",
  process: async function (bot, msg, suffix) {
    if (!suffix.trim()) return msg.channel.send(`Uso: ${this.usage}`);
    const id = `${Date.now()}-${msg.author.id}`;
    store.update((state) => {
      state.suggestions[id] = {
        id,
        guildId: guildId(msg),
        channelId: msg.channel.id,
        authorId: msg.author.id,
        text: suffix.trim(),
        createdAt: new Date().toISOString(),
        status: "pending",
      };
    });
    const sent = await msg.channel.send(`💡 **Sugestão**\n${suffix.trim()}\n\nEnviada por ${msg.author}`);
    await addReaction(sent, "👍");
    await addReaction(sent, "👎");
  },
};

exports.remind = {
  usage: "<duração> <texto> (ex.: 2h revisar relatório)",
  description: "Agenda um lembrete neste canal.",
  process: function (bot, msg, suffix) {
    const [duration, ...textParts] = suffix.trim().split(/\s+/);
    const durationMs = parseDuration(duration);
    const text = textParts.join(" ");
    if (!durationMs || !text) return msg.channel.send(`Uso: ${this.usage}`);
    const reminder = {
      id: `${Date.now()}-${msg.author.id}`,
      channelId: msg.channel.id,
      userId: msg.author.id,
      text,
      dueAt: Date.now() + durationMs,
    };
    store.update((state) => { state.reminders[reminder.id] = reminder; });
    scheduleReminder(reminder, bot);
    return msg.channel.send(`⏰ Lembrete agendado para <t:${Math.floor(reminder.dueAt / 1000)}:R>.`);
  },
};

exports.warn = {
  usage: "<@usuário> <motivo>",
  description: "Registra uma advertência de moderação.",
  process: function (bot, msg, suffix) {
    if (!isModerator(msg)) return msg.channel.send("Você precisa da permissão de moderador.");
    const member = msg.mentions.members.first();
    const reason = suffix.replace(/<@!?\d+>/, "").trim() || "Sem motivo informado";
    if (!member) return msg.channel.send(`Uso: ${this.usage}`);
    const warning = {
      id: `${Date.now()}-${member.id}`,
      moderatorId: msg.author.id,
      reason,
      createdAt: new Date().toISOString(),
    };
    store.update((state) => {
      const key = `${guildId(msg)}:${member.id}`;
      state.warnings[key] ||= [];
      state.warnings[key].push(warning);
    });
    return msg.channel.send(`⚠️ ${member.user.tag} recebeu uma advertência: ${reason}`);
  },
};

exports.warnings = {
  usage: "<@usuário>",
  description: "Mostra o histórico de advertências.",
  process: function (bot, msg, suffix) {
    if (!isModerator(msg)) return msg.channel.send("Você precisa da permissão de moderador.");
    const member = msg.mentions.members.first();
    if (!member) return msg.channel.send(`Uso: ${this.usage}`);
    const items = store.value.warnings[`${guildId(msg)}:${member.id}`] || [];
    if (!items.length) return msg.channel.send(`${member.user.tag} não possui advertências.`);
    return msg.channel.send(`⚠️ **${member.user.tag}** possui ${items.length} advertência(s):\n${items.map((item, i) => `${i + 1}. ${item.reason}`).join("\n")}`);
  },
};

exports.clearwarnings = {
  usage: "<@usuário>",
  description: "Remove o histórico de advertências.",
  process: function (bot, msg, suffix) {
    if (!isModerator(msg)) return msg.channel.send("Você precisa da permissão de moderador.");
    const member = msg.mentions.members.first();
    if (!member) return msg.channel.send(`Uso: ${this.usage}`);
    store.update((state) => { delete state.warnings[`${guildId(msg)}:${member.id}`]; });
    return msg.channel.send(`✅ Histórico de ${member.user.tag} removido.`);
  },
};

exports.giveaway = {
  usage: "<duração> | <prêmio>",
  description: "Cria um sorteio com reação 🎉.",
  process: async function (bot, msg, suffix) {
    if (!isModerator(msg)) return msg.channel.send("Você precisa da permissão de moderador.");
    const parts = splitPipeArgs(suffix, 2);
    const durationMs = parts && parseDuration(parts[0]);
    if (!parts || !durationMs) return msg.channel.send(`Uso: ${this.usage}`);
    const sent = await msg.channel.send(`🎉 **SORTEIO**\nPrêmio: ${parts[1]}\nTermina em <t:${Math.floor((Date.now() + durationMs) / 1000)}:R>\nReaja com 🎉 para participar!`);
    await addReaction(sent, "🎉");
    setTimeout(async () => {
      try {
        const reaction = sent.reactions.cache.get("🎉");
        const users = reaction ? await reaction.users.fetch() : new Map();
        const participants = [...users.values()].filter((user) => !user.bot);
        const winner = participants[Math.floor(Math.random() * participants.length)];
        await msg.channel.send(winner ? `🏆 Parabéns ${winner}, você ganhou **${parts[1]}**!` : "O sorteio terminou sem participantes.");
      } catch (error) {
        console.error(`Unable to finish giveaway: ${error.message}`);
      }
    }, durationMs);
  },
};

exports.welcome = {
  usage: "<#canal> <mensagem>",
  description: "Configura a mensagem de boas-vindas deste servidor.",
  process: function (bot, msg, suffix) {
    if (!isModerator(msg)) return msg.channel.send("Você precisa da permissão de moderador.");
    const channel = msg.mentions.channels.first();
    const text = suffix.replace(/<#\d+>/, "").trim();
    if (!channel || !text) return msg.channel.send(`Uso: ${this.usage}`);
    store.update((state) => { state.settings[guildId(msg)] = { ...(state.settings[guildId(msg)] || {}), welcomeChannelId: channel.id, welcomeText: text }; });
    return msg.channel.send("✅ Boas-vindas configuradas. Use `{user}` para mencionar o novo membro.");
  },
};

exports.tempvoice = {
  usage: "<#canal lobby>",
  description: "Configura o canal que cria salas de voz temporárias.",
  process: function (bot, msg, suffix) {
    if (!isModerator(msg)) return msg.channel.send("Você precisa da permissão de moderador.");
    const channel = msg.mentions.channels.first();
    if (!channel || channel.type !== "GUILD_VOICE") return msg.channel.send(`Uso: ${this.usage}`);
    store.update((state) => { state.settings[guildId(msg)] = { ...(state.settings[guildId(msg)] || {}), tempVoiceChannelId: channel.id }; });
    return msg.channel.send("✅ Canal de voz temporário configurado.");
  },
};

exports.init = function (hooks) {
  const recentMessages = new Map();
  for (const reminder of Object.values(store.value.reminders)) {
    if (reminder.dueAt > Date.now() && hooks.bot) scheduleReminder(reminder, hooks.bot);
  }
  hooks.onGuildMemberAdd ||= [];
  hooks.onVoiceStateUpdate ||= [];
  hooks.onMessage ||= [];
  const temporaryChannels = new Set();
  hooks.onMessage.push(async (message) => {
    if (!message.guild || message.author.bot) return;
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const timestamps = (recentMessages.get(key) || []).filter((time) => now - time < 5000);
    timestamps.push(now);
    recentMessages.set(key, timestamps);
    if (timestamps.length < 8) return;
    recentMessages.set(key, []);
    await message.delete().catch(() => {});
    const notice = await message.channel.send(`${message.author}, aguarde alguns segundos antes de enviar mais mensagens.`).catch(() => null);
    if (notice) setTimeout(() => notice.delete().catch(() => {}), 5000);
  });
  hooks.onGuildMemberAdd.push(async (member) => {
    const settings = store.value.settings[member.guild.id];
    if (!settings?.welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
    if (channel) await channel.send(settings.welcomeText.replace("{user}", `<@${member.id}>`));
  });
  hooks.onVoiceStateUpdate.push(async (oldState, newState) => {
    const oldChannel = oldState.channel;
    if (oldChannel && temporaryChannels.has(oldChannel.id) && oldChannel.members.size === 0) {
      temporaryChannels.delete(oldChannel.id);
      await oldChannel.delete().catch(() => {});
    }
    const settings = store.value.settings[newState.guild.id];
    if (!settings?.tempVoiceChannelId || newState.channelId !== settings.tempVoiceChannelId) return;
    const channel = await newState.guild.channels.create(`Sala de ${newState.member.displayName}`, {
      type: "GUILD_VOICE",
      parent: newState.channel?.parentId || undefined,
    });
    temporaryChannels.add(channel.id);
    await newState.setChannel(channel);
  });
};
