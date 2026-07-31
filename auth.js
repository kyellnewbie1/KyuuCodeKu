// auth.js
// ===== STATE GLOBAL =====
let currentUser = null;
let currentProfile = null;
let allSnippets = [];

// ===== LOAD PROFILE =====
async function loadProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Load profile error:', error);
    return null;
  }
  if (data) {
    currentProfile = data;
    return data;
  } else {
    // Buat profile jika belum ada
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: currentUser?.email?.split('@')[0] || 'user',
        role: 'user',
      })
      .select()
      .single();
    if (insertError) {
      console.error('Insert profile error:', insertError);
      return null;
    }
    currentProfile = newProfile;
    return newProfile;
  }
}

// ===== LOGOUT =====
async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  window.location.href = 'auth.html';
}

// ===== CEK SESSION =====
async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    currentUser = data.session.user;
    await loadProfile(currentUser.id);
    return true;
  }
  return false;
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || (() => {
    const div = document.createElement('div');
    div.className = 'toast-container';
    div.id = 'toastContainer';
    document.body.appendChild(div);
    return div;
  })();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-check-circle' :
               type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ===== LOAD SNIPPETS =====
async function loadSnippets() {
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Load snippets error:', error);
    return [];
  }
  allSnippets = data || [];
  return allSnippets;
}

// auth.js
// ... (semua fungsi sebelumnya tetap ada, tambahkan di bawah)

// ===== UPLOAD FILE KE SUPABASE STORAGE =====
async function uploadSnippetFile(file, userId) {
  if (!file) return null;
  // Validasi ukuran file (max 1MB)
  if (file.size > 1024 * 1024) {
    showToast('Ukuran file maksimal 1MB', 'error');
    return null;
  }
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filePath, file);

  if (error) {
    console.error('Upload error:', error);
    showToast('Gagal upload file: ' + error.message, 'error');
    return null;
  }
  return { path: filePath, name: file.name, size: file.size };
}

// ===== HAPUS FILE DARI STORAGE =====
async function deleteSnippetFile(filePath) {
  if (!filePath) return;
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .remove([filePath]);
  if (error) {
    console.error('Delete file error:', error);
  }
}

// ===== AMBIL PUBLIC URL FILE =====
function getFileUrl(filePath) {
  if (!filePath) return null;
  const { data } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

// ===== BACA FILE SEBAGAI TEKS =====
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e.target.error);
    reader.readAsText(file);
  });
}