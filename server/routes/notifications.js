const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Setup web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:cosen.hub@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ VAPID keys are missing from environment variables. Push notifications will not work.');
}

// Auth middleware for admin endpoints
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
  next();
};

/**
 * POST /api/notifications/subscribe
 * Allows any client to save their push subscription
 */
router.post('/subscribe', async (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    // Check if it already exists to avoid unique constraint errors
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys.p256dh,
          keys_auth: subscription.keys.auth
        });

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to save subscription' });
      }
    }

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/notifications/broadcast
 * Admin endpoint to send a notification to all subscribers
 */
router.post('/broadcast', authenticateAdmin, async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    // Fetch all subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ success: true, message: 'No active subscriptions' });
    }

    const payload = JSON.stringify({ title, body });
    const promises = subs.map(async (sub) => {
      const subscriptionObj = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth
        }
      };

      try {
        await webpush.sendNotification(subscriptionObj, payload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid, delete it
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Push error for endpoint:', sub.endpoint, err);
        }
      }
    });

    await Promise.all(promises);

    res.status(200).json({ success: true, message: `Broadcasted to ${subs.length} devices` });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
