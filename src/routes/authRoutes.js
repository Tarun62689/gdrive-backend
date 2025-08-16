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

    const { access_token, refresh_token } = data.session;

    // ✅ Store tokens in HttpOnly cookies
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on Render
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // safe locally
      maxAge: 1000 * 60 * 60, // 1h
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    });

    return res.status(200).json({ user: data.user });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ✅ User Logout
 */
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
