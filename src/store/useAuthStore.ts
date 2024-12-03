import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';
import { supabase } from '../config/supabase';

interface AuthState {
  user: User | null;
  session: any;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setSession: (session: any) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setSession: (session) => set({ session }),
      login: async (email: string, password: string) => {
        try {
          // Clear any existing session first
          await supabase.auth.signOut();

          // Attempt to sign in
          const { data: { session }, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            console.error('Authentication error:', error);
            return { 
              success: false, 
              error: error.message || 'Invalid credentials'
            };
          }

          if (!session) {
            return { 
              success: false, 
              error: 'No session created after login' 
            };
          }

          // Get operator data
          const { data: operator, error: operatorError } = await supabase
            .from('operators')
            .select('*')
            .eq('email', email)
            .eq('active', true)
            .single();

          if (operatorError || !operator) {
            console.error('Operator fetch error:', operatorError);
            return { 
              success: false, 
              error: 'No active operator found with this email' 
            };
          }

          // Set user and session data
          set({
            user: {
              id: operator.id,
              name: operator.name,
              email: operator.email,
              role: operator.role,
              permissions: Object.entries(operator.permissions)
                .filter(([_, value]) => value)
                .map(([key]) => key),
              active: operator.active,
            },
            session
          });

          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          return { 
            success: false, 
            error: 'An unexpected error occurred during login' 
          };
        }
      },
      logout: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, session: null });
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear the local state even if the API call fails
          set({ user: null, session: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 10,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version < 10) {
          return { user: null, session: null };
        }
        return persistedState as AuthState;
      },
    }
  )
);