'use client';

import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

type Props = { children: ReactNode };

export default function RootLayout({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>(null!);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth'); // redirect if not logged in
      } else {
        setUser(user); // store user locally
      }

      setLoading(false);
    };

    fetchUser();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
