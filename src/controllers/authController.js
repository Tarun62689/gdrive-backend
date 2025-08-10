// controllers/authController.js
import { supabase, supabaseAdmin } from '../services/supabaseClient.js';

// Helper: Create default "My Drive" folder + subfolders
const createDefaultDrive = async (userId) => {
  const { data: myDrive, error: myDriveError } = await supabaseAdmin
    .from('folders')
    .insert([{
      name: 'My Drive',
      user_id: userId,
      parent_folder_id: null, // Change to match DB column
      is_trashed: false
    }])
    .select()
    .single();

  if (myDriveError) throw new Error(`My Drive insert failed: ${myDriveError.message}`);

  const defaultSubfolders = ['Documents', 'Pictures', 'Videos'].map(name => ({
    name,
    user_id: userId,
    parent_folder_id: myDrive.id,
    is_trashed: false
  }));

  const { error: subfolderError } = await supabaseAdmin
    .from('folders')
    .insert(defaultSubfolders);

  if (subfolderError) throw new Error(`Subfolders insert failed: ${subfolderError.message}`);

  return myDrive;
};

// Signup
export async function signup(req, res) {
  const { email, password } = req.body;

  try {
    // Create user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;
    console.log("New user ID:", userId);

    if (userId) {
      try {
        await createDefaultDrive(userId);
      } catch (folderError) {
        console.error(folderError);
        return res.status(500).json({
          error: 'User created but failed to initialize My Drive folders'
        });
      }
    }

    res.status(201).json({
      message: 'User created successfully with My Drive initialized',
      user: data.user
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Login
export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    res.status(200).json({
      message: 'Login successful',
      token: data.session?.access_token,
      user: data.user
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Logout
export async function logout(req, res) {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
