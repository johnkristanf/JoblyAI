import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
)


export async function getAccessToken() {
    const { data, error } = await supabase.auth.getSession();
  
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
  
    if (data.session) {
      return data.session.access_token;
    } else {
      console.log('No active session found.');
      return null;
    }
}