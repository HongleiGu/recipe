'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/recipe';

const AuthForm = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);

  // Upload avatar to Supabase Storage and return public URL
  const uploadAvatar = async (userId: string, file: File): Promise<string | undefined> => {
    try {
      // Generate a unique filename
      const filename = `avatars/${userId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filename, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Avatar upload failed', err);
      return undefined;
    }
  };

  const upsertProfile = async (user: User, avatarUrl?: string) => {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username?.trim() || user.email?.split('@')[0],
      avatar_url: avatarUrl || null,
      last_login: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) throw error;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!email.trim() || !password.trim()) throw new Error('Email and password are required');

      let user: User | null = null;

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (!data.user) throw new Error('Signup failed');

        user = data.user;

        let avatarUrl: string | undefined = undefined;
        if (avatarFile) avatarUrl = await uploadAvatar(user.id, avatarFile);

        await upsertProfile(user, avatarUrl);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (!data.user) throw new Error('Login failed');

        user = data.user;

        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);
      }

      router.push('/');
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto max-w-md px-4 text-center">
      <div className="w-full max-w-md rounded-2xl bg-transparent p-8 text-center">
        <h1 className="text-2xl font-semibold">
          {isSignup ? 'Create an account' : 'Welcome back'}
        </h1>

        <div className="mt-6 space-y-4">
          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border px-4 py-2"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
          />

          {error && <p className="text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn"
          >
            {loading ? 'Please wait…' : isSignup ? 'Create Account' : 'Log In'}
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          {isSignup ? 'Already have an account?' : 'No account yet?'}{' '}
          <button onClick={() => setIsSignup(!isSignup)} className="btn">
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
