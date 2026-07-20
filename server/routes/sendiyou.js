const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// ─────────────────────────────────────────────────────────
// Supabase (service-role for atomic writes)
// ─────────────────────────────────────────────────────────
let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
}

// ─────────────────────────────────────────────────────────
// Master Alias List  (50 unique Adjective + Animal + Emoji)
// ─────────────────────────────────────────────────────────
const ALIAS_LIST = [
  'Shadow Wolf 🐺',   'Neon Fox 🦊',       'Crimson Bear 🐻',
  'Ghost Hawk 🦅',    'Storm Tiger 🐯',    'Silver Owl 🦉',
  'Dark Panther 🐆',  'Blazing Lion 🦁',   'Frozen Deer 🦌',
  'Mystic Cat 🐱',    'Jade Raven 🪶',     'Ember Falcon 🔥',
  'Cobalt Shark 🦈',  'Solar Eagle 🌞',    'Iron Panda 🐼',
  'Lunar Rabbit 🐇',  'Venom Snake 🐍',    'Camo Frog 🐸',
  'Phantom Crow 🐦',  'Glacial Wolf 🌨️',   'Blaze Fox 🔥',
  'Amber Owl 🟡',     'Rust Tiger 🟤',     'Violet Bear 💜',
  'Coral Shark 🪸',   'Prism Hawk 🌈',     'Onyx Lion ⚫',
  'Arctic Fox 🧊',    'Bronze Eagle 🥉',   'Scarlet Raven ❤️',
  'Hollow Wolf 🌑',   'Spark Panther ⚡',  'Titan Elephant 🐘',
  'Echo Dolphin 🐬',  'Void Crow 🖤',      'Cosmic Cat 🌌',
  'Silent Lynx 🤫',   'Wild Horse 🐎',     'Radiant Deer ✨',
  'Iron Horse 🔩',    'Omega Wolf 🔱',     'Nova Falcon 🌟',
  'Ghost Panda 👻',   'Cyber Snake 🤖',    'Lone Tiger 🏔️',
  'Maroon Eagle 🏴',  'Midnight Fox 🌙',   'Roaming Bear 🗺️',
  'Haze Lynx 🌫️',    'Dusk Raven 🌆',
];

// ─────────────────────────────────────────────────────────
// Helper: generateAlias
//   1. If user already has an alias in this group → return it
//   2. Otherwise pick a random unused alias → save → return
// ─────────────────────────────────────────────────────────
async function generateAlias(chatId, userId) {
  const db = getSupabase();

  // 1. Existing alias?
  const { data: existing } = await db
    .from('group_members')
    .select('alias')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing.alias;

  // 2. Fetch all used aliases in this group
  const { data: used } = await db
    .from('group_members')
    .select('alias')
    .eq('chat_id', chatId);

  const usedSet = new Set((used || []).map(r => r.alias));

  // Guard: max 50 members
  if (usedSet.size >= 50) {
    throw new Error('Group is full (max 50 members).');
  }

  // 3. Pick random unused alias
  const available = ALIAS_LIST.filter(a => !usedSet.has(a));
  const alias = available[Math.floor(Math.random() * available.length)];

  // 4. Insert member record
  const { error: insertErr } = await db
    .from('group_members')
    .insert([{ chat_id: chatId, user_id: userId, alias }]);

  if (insertErr) {
    // Concurrent insert? Try reading again
    const { data: retry } = await db
      .from('group_members')
      .select('alias')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .maybeSingle();
    if (retry) return retry.alias;
    throw insertErr;
  }

  return alias;
}

// ─────────────────────────────────────────────────────────
// POST /api/sendiyou/join-group
//   Body: { post_id, user_id }
//   Returns: { chat_id, alias }
// ─────────────────────────────────────────────────────────
router.post('/join-group', async (req, res) => {
  try {
    const { post_id, user_id } = req.body;
    if (!post_id || !user_id) {
      return res.status(400).json({ error: 'post_id and user_id are required.' });
    }

    const db = getSupabase();

    // Fetch the post to confirm it's a Group type and get creator_id
    const { data: post, error: postErr } = await db
      .from('sendiyou_posts')
      .select('id, creator_id, connection_type, preferred_gender')
      .eq('id', post_id)
      .single();

    if (postErr || !post) return res.status(404).json({ error: 'Post not found.' });
    if (post.connection_type !== 'Group') {
      return res.status(400).json({ error: 'This post is not a Group connection.' });
    }

    // Find or create the single group chat for this post
    let chatId;
    const { data: existingChat } = await db
      .from('sendiyou_chats')
      .select('id, participant_ids')
      .eq('post_id', post_id)
      .maybeSingle();

    if (existingChat) {
      chatId = existingChat.id;

      // Add user to participant_ids if not already there
      if (!existingChat.participant_ids.includes(user_id)) {
        const newParticipants = [...existingChat.participant_ids, user_id];
        await db
          .from('sendiyou_chats')
          .update({ participant_ids: newParticipants })
          .eq('id', chatId);
      }
    } else {
      // Create the group chat — initially just the creator + this user
      const { data: newChat, error: createErr } = await db
        .from('sendiyou_chats')
        .insert([{
          post_id,
          participant_ids: [post.creator_id, user_id],
          revealed_ids: [],
          is_group: true,
        }])
        .select()
        .single();

      if (createErr) throw createErr;
      chatId = newChat.id;
    }

    // Assign alias (idempotent)
    const alias = await generateAlias(chatId, user_id);

    // Ensure creator also has an alias
    await generateAlias(chatId, post.creator_id).catch(() => {});

    return res.json({ chat_id: chatId, alias });
  } catch (err) {
    console.error('join-group error:', err);
    return res.status(500).json({ error: err.message || 'Failed to join group.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/sendiyou/toggle-identity
//   Body: { chat_id, user_id, action: 'reveal' | 'hide' }
//   Returns: { ok: true }
// ─────────────────────────────────────────────────────────
router.post('/toggle-identity', async (req, res) => {
  try {
    const { chat_id, user_id, action } = req.body;
    if (!chat_id || !user_id || !action) {
      return res.status(400).json({ error: 'chat_id, user_id, and action are required.' });
    }

    const isRevealing = action === 'reveal';
    const db = getSupabase();

    // 1. Get the member's alias + revealed status
    const { data: member, error: memberErr } = await db
      .from('group_members')
      .select('alias, is_revealed')
      .eq('chat_id', chat_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (memberErr) throw memberErr;

    const alias = member?.alias || 'Anonymous';

    if (member && member.is_revealed === isRevealing) {
      return res.json({ ok: true, already: true });
    }

    // 2. Get user's real name
    const { data: userRow } = await db
      .from('users')
      .select('name')
      .eq('id', user_id)
      .single();

    const realName = userRow?.name || 'Someone';

    // 3. Update group_members
    if (member) {
      await db
        .from('group_members')
        .update({ is_revealed: isRevealing })
        .eq('chat_id', chat_id)
        .eq('user_id', user_id);
    }

    // 4. Update revealed_ids in sendiyou_chats
    const { data: chatRow } = await db
      .from('sendiyou_chats')
      .select('revealed_ids')
      .eq('id', chat_id)
      .single();

    let newRevealedIds = [...(chatRow?.revealed_ids || [])];
    if (isRevealing) {
      if (!newRevealedIds.includes(user_id)) newRevealedIds.push(user_id);
    } else {
      newRevealedIds = newRevealedIds.filter(id => id !== user_id);
    }

    await db
      .from('sendiyou_chats')
      .update({ revealed_ids: newRevealedIds })
      .eq('id', chat_id);

    // 5. Insert system message
    const msgContent = isRevealing
      ? `🔓 ${alias} has revealed their identity as ${realName}`
      : `🕵️ ${realName} has hidden their identity and is now ${alias}`;

    await db
      .from('messages')
      .insert([{
        chat_id,
        sender_id: user_id,
        content: msgContent,
        type: 'SYSTEM',
      }]);

    return res.json({ ok: true });
  } catch (err) {
    console.error('toggle-identity error:', err);
    return res.status(500).json({ error: err.message || 'Failed to toggle identity.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/sendiyou/group-members/:chatId
//   Returns full member list with user profile data
//   Frontend decides what to show based on is_revealed
// ─────────────────────────────────────────────────────────
router.get('/group-members/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const db = getSupabase();

    const { data, error } = await db
      .from('group_members')
      .select(`
        user_id, alias, is_revealed, joined_at,
        users ( name, branch, gender, custom_avatar_url, bio, email )
      `)
      .eq('chat_id', chatId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('group-members error:', err);
    return res.status(500).json({ error: 'Failed to fetch group members.' });
  }
});

module.exports = router;
