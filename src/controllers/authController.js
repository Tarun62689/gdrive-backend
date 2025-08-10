import { supabase } from '../services/supabaseClient.js';

// ✅ Helper: Create default "My Drive" folder + subfolders
const createDefaultDrive = async (userId) => {
  const { data: myDrive, error: myDriveError } = await supabase
    .from('folders')
    .insert([{
      name: 'My Drive',
      user_id: userId,
      parent_folder_id: null,
      is_trashed: false
    }])
    .select()
    .single();

  if (myDriveError) throw myDriveError;

  const defaultSubfolders = ['Documents', 'Pictures', 'Videos'].map(name => ({
    name,
    user_id: userId,
    parent_folder_id: myDrive.id,
    is_trashed: false
  }));

  const { error: subfolderError } = await supabase
    .from('folders')
    .insert(defaultSubfolders);

  if (subfolderError) throw subfolderError;

  return myDrive;
};

// 📌 Signup - create user with email and password
export async function signup(req, res) {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;

    if (userId) {
      try {
        await createDefaultDrive(userId);
      } catch (folderError) {
        console.error("Error creating My Drive:", folderError.message);
        return res.status(500).json({
          error: 'User created but failed to initialize My Drive folders'
        });
      }
    }

    // If no token (because email confirmation is enabled), sign in directly
    let token = data.session?.access_token;
    if (!token) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (!loginError) {
        token = loginData.session?.access_token;
      }
    }

    res.status(201).json({
      message: 'User created successfully with My Drive initialized',
      token,
      user: data.user
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 📌 Login - sign in user
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

// 📌 Logout - revoke session
export async function logout(req, res) {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
