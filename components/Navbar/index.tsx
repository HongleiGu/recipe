'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { FALLBACK_AVATAR } from '@/lib/utils';

type Profile = {
  id: string;
  username: string;
  avatar_url?: string | null;
};

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch current user and profile
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ?? null);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', user.id)
          .single();
        setProfile(profileData ?? null);
        console.log(profileData)
      }
    };

    fetchUserAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-md shadow-sm pb-4 pt-4">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          {[
            { name: 'Home', href: '/' },
            { name: 'Recipes', href: '/recipes' },
            { name: 'Upload', href: '/recipes/upload' }
          ].map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-semibold transition-colors duration-200 ${
                isActive(link.href)
                  ? 'text-[#FFD1DC] drop-shadow-sm'
                  : 'text-[#5D4037] hover:text-[#FFD1DC]'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Auth / Avatar */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Avatar using Next.js Image */}
              {profile && (
                <div className="relative h-10 w-10 rounded-full overflow-hidden border border-gray-300">
                  <Image
                    src={profile.avatar_url || FALLBACK_AVATAR}
                    alt={profile.username || 'User avatar'}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              )}

              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-[#5D4037] hover:text-[#FFD1DC]"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="text-sm font-semibold text-[#5D4037] hover:text-[#FFD1DC]"
            >
              Login / Signup
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
