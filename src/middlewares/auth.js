// middleware/auth.js
import { supabase } from "../services/supabaseClient.js";

export const authenticateUser = async (req, res, next) => {
  try {
    // 1️⃣ Read token from cookie
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 2️⃣ Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error("Supabase auth error:", error?.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 3️⃣ Attach user to request
    req.user = data.user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(500).json({ error: "Authentication failed" });
  }
};
