// ============================================
// Supabase 客户端 - 认证 + 云端同步 API
// ============================================
(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://azwttkbuhetspowgxgwt.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6d3R0a2J1aGV0c3Bvd2d4Z3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzIxNzcsImV4cCI6MjA5NTYwODE3N30.m_3lW_UoMDr0r8WK__t4r6Q2gRjHd76bGhNtSib4Yw0';

  let supabase = null;

  function getClient() {
    if (!supabase) {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
        });
      } else { throw new Error('Supabase SDK 未加载'); }
    }
    return supabase;
  }

  function usernameToEmail(username) { return username.trim().toLowerCase() + '@custom-tabs.local'; }

  async function signUp(username, password) {
    const client = getClient();
    const email = usernameToEmail(username);
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { display_name: username.trim() } } });
    if (error) throw error;
    if (data.session) return { user: data.user, session: data.session };
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    return { user: signInData.user, session: signInData.session };
  }

  async function signIn(username, password, rememberMe) {
    const client = getClient();
    const email = usernameToEmail(username);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!rememberMe) sessionStorage.setItem('cst_temp_session', 'true');
    else sessionStorage.removeItem('cst_temp_session');
    return { user: data.user, session: data.session };
  }

  async function signOut() {
    const client = getClient();
    sessionStorage.removeItem('cst_temp_session');
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function getCurrentUser() {
    const client = getClient();
    const { data } = await client.auth.getSession();
    return data.session ? data.session.user : null;
  }

  async function getCurrentSession() {
    const client = getClient();
    const { data } = await client.auth.getSession();
    return data.session;
  }

  async function changePassword(newPassword) {
    const client = getClient();
    const { data, error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data.user;
  }

  function getDisplayName(user) {
    if (!user) return null;
    return user.user_metadata?.display_name || user.email?.replace('@custom-tabs.local', '') || '用户';
  }

  async function uploadData(stateData) {
    const client = getClient();
    const session = await getCurrentSession();
    if (!session) throw new Error('未登录');
    const cleanData = {
      user_id: session.user.id,
      categories: stateData.categories || [],
      favorites: stateData.favorites || [],
      history: stateData.history || [],
      current_engine: stateData.currentEngine || 0,
      wallpaper: stateData.wallpaper || null,
      updated_at: new Date().toISOString()
    };
    const { data: existing } = await client.from('user_data').select('id').eq('user_id', session.user.id).maybeSingle();
    let result;
    if (existing) result = await client.from('user_data').update(cleanData).eq('user_id', session.user.id);
    else result = await client.from('user_data').insert(cleanData);
    if (result.error) throw result.error;
    return result.data;
  }

  async function downloadData() {
    const client = getClient();
    const session = await getCurrentSession();
    if (!session) throw new Error('未登录');
    const { data, error } = await client.from('user_data').select('*').eq('user_id', session.user.id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { categories: data.categories || [], favorites: data.favorites || [], history: data.history || [], currentEngine: data.current_engine || 0, wallpaper: data.wallpaper || null, updatedAt: data.updated_at };
  }

  function onAuthStateChange(callback) {
    const client = getClient();
    return client.auth.onAuthStateChange((event, session) => callback(event, session));
  }

  window.CST = {
    signUp, signIn, signOut, getCurrentUser, getCurrentSession, changePassword, getDisplayName,
    uploadData, downloadData, onAuthStateChange, getSupabase: getClient
  };
  console.log('✅ Supabase 客户端已就绪');
})(window);