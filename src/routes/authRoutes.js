import express from "express";
import { supabase } from "../services/supabaseClient.js";
import { authenticateUser } from "../middlewares/auth.js"; // middleware reads Bearer token

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
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    if (!data.session) return res.status(401).json({ error: "Invalid credentials." });

    // ✅ Return user + access token for frontend
    return res.status(200).json({
      message: "Login successful",
      user: data.user,
      token: data.session.access_token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ✅ Get Current User
 */
router.get("/me", authenticateUser, (req, res) => {
  try {
    // req.user is set by authenticateUser middleware
    return res.status(200).json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ✅ User Logout
 */
router.post("/logout", (req, res) => {
  try {
    // Frontend just removes token from localStorage
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
