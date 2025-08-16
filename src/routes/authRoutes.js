// routes/authRoutes.js
import express from "express";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

/**
 * ✅ User Signup
 * Creates a new account in Supabase
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

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
 * Signs in a user and sets HttpOnly cookies
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const { access_token, refresh_token } = data.session;

    // ✅ Store tokens in HttpOnly cookies
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on Render
      sameSite: "none",  // 🔑 needed for cross-domain
      maxAge: 1000 * 60 * 60
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });


    return res.status(200).json({ user: data.user });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ✅ User Logout
 * Clears auth cookies
 */
router.post("/logout", (req, res) => {
  try {
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on Render
      sameSite: "none",  // 🔑 needed for cross-domain
      maxAge: 1000 * 60 * 60
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7
    });


    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
