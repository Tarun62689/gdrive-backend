import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ message: 'Signup successful. Please verify your email.' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return res.status(400).json({ error: error.message });

  const accessToken = data.session.access_token;

  // Send JWT as httpOnly cookie
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: false, // set to true in production
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  res.status(200).json({ user: data.user });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  });

  res.status(200).json({ message: 'Logged out successfully.' });
});

export default router;
