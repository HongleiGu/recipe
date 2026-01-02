import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { UserProfile } from '@/types/recipe'
import { FALLBACK_AVATAR } from '@/lib/utils'

type PageProps = {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = params

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      display_name,
      bio,
      avatar_url,
      recipes (
        id,
        title,
        slug,
        created_at
      )
    `)
    .eq('username', username)
    .single()

  if (error || !data) {
    throw new Error('Profile not found')
  }

  const profile = data as UserProfile

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-10">
      {/* ================= Header ================= */}
      <section className="flex items-center gap-6">
        <Image
          src={profile.avatar_url || FALLBACK_AVATAR}
          alt={profile.username}
          width={96}
          height={96}
          className="rounded-full object-cover"
        />

        <div>
          <h1 className="text-3xl font-bold">
            {profile.username}
          </h1>

          {profile.bio && (
            <p className="mt-2 text-gray-600 max-w-xl">
              {profile.bio}
            </p>
          )}
        </div>
      </section>

      {/* ================= Recipes ================= */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Recipes by {profile.username}
        </h2>

        {profile.recipes.length === 0 ? (
          <p className="text-gray-500">No recipes yet.</p>
        ) : (
          <ul className="space-y-3">
            {profile.recipes.map((recipe) => (
              <li key={recipe.id}>
                <Link
                  href={`/recipes/${recipe.slug}`}
                  className="block rounded-lg border p-4 hover:bg-gray-50"
                >
                  <h3 className="font-medium">{recipe.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
