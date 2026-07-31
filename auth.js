// auth.js
let currentUser = null;
let currentProfile = null;
let allSnippets = [];

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ==========================================
// USER PROFILE MANAGEMENT
// ==========================================
async function loadProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading profile:', error);
      return null;
    }

    if (data) {
      currentProfile = data;
    } else {
      // Buat profile default jika belum ada
      const userObj = (await supabase.auth.getUser()).data.user;
      const username = userObj?.user_metadata?.username || userObj?.email?.split('@')[0] || 'User';
      const newProfile = {
        id: userId,
        username: username,
        role: 'user',
        bio: '',
        avatar_url: ''
      };
      const { data: inserted, error: insertError } = await supabase.from('profiles').insert([newProfile]).select().single();
      if (!insertError) currentProfile = inserted;
      else currentProfile = newProfile;
    }

    updateNavbarProfile();
    return currentProfile;
  } catch (err) {
    console.error('loadProfile exception:', err);
    return null;
  }
}

function updateNavbarProfile() {
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');

  if (currentProfile) {
    if (nameEl) nameEl.textContent = currentProfile.username || 'User';
    if (roleEl) roleEl.textContent = currentProfile.role || 'user';
    if (avatarEl) {
      if (currentProfile.avatar_url) {
        avatarEl.innerHTML = `<img src="${currentProfile.avatar_url}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        avatarEl.textContent = (currentProfile.username || 'U').charAt(0).toUpperCase();
      }
    }
  }
}

async function updateProfileData({ username, bio, avatar_url }) {
  if (!currentUser) return false;
  try {
    const updates = {
      username: username,
      bio: bio,
      avatar_url: avatar_url,
      updated_at: new Date()
    };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUser.id);

    if (error) throw error;
    
    currentProfile = { ...currentProfile, ...updates };
    updateNavbarProfile();
    showToast('Profil berhasil diperbarui! ✨', 'success');
    return true;
  } catch (err) {
    showToast('Gagal memperbarui profil: ' + err.message, 'error');
    return false;
  }
}

// Upload Avatar Foto Profil
async function uploadAvatarFile(file) {
  if (!currentUser) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar_${currentUser.id}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(window.SUPABASE_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(window.SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    showToast('Gagal mengunggah foto profil: ' + err.message, 'error');
    return null;
  }
}

// ==========================================
// SNIPPET FILE MANAGEMENT
// ==========================================
async function loadSnippets() {
  try {
    const { data, error } = await supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allSnippets = data || [];
    return allSnippets;
  } catch (err) {
    console.error('Error loading snippets:', err);
    showToast('Gagal memuat snippet', 'error');
    return [];
  }
}

function getFileUrl(filePath) {
  if (!filePath) return null;
  const { data } = supabase.storage.from(window.SUPABASE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || null;
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function uploadSnippetFile(file, userId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from(window.SUPABASE_BUCKET)
      .upload(filePath, file);

    if (error) throw error;
    return { path: filePath, name: file.name, size: file.size };
  } catch (err) {
    showToast('Gagal upload file: ' + err.message, 'error');
    return null;
  }
}

async function deleteSnippetFile(filePath) {
  if (!filePath) return;
  try {
    await supabase.storage.from(window.SUPABASE_BUCKET).remove([filePath]);
  } catch (err) {
    console.error('Error deleting file:', err);
  }
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'auth.html';
}
