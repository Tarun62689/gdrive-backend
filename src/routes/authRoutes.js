import express from "express";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

/**
 * ✅ User Signup
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      message: "Signup successful. Please verify your email.",
      user: data.user,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ✅ User Login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    if (!data.session) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // ✅ Return user + access token in JSON
    return res.status(200).json({
      message: "Login successful",
      user: data.user,
      token: data.session.access_token, // frontend will store this
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ✅ User Logout
 */
router.post("/logout", (req, res) => {
  try {
    // Logout can just clear frontend localStorage token
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
