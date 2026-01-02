'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

interface RecipeCardData {
  id: string
  title: string
  slug: string
  coverUrl: string
  mediaCount: number
}

const RecipesFeed: React.FC = () => {
  const router = useRouter()
  const [recipes, setRecipes] = useState<RecipeCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecipes = async () => {
      // 1️⃣ Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setRecipes([])
        setLoading(false)
        return
      }

      // 2️⃣ Fetch only this user's recipes
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          slug,
          recipe_media(file_path)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (error || !data) {
        console.error(error)
        setLoading(false)
        return
      }

      // 3️⃣ Map to UI shape
      const mapped: RecipeCardData[] = data.map((r) => {
        const coverPath = r.recipe_media?.[0]?.file_path
        const coverUrl = coverPath
          ? supabase.storage
              .from('recipe-media')
              .getPublicUrl(coverPath).data.publicUrl
          : ''

        return {
          id: r.id,
          title: r.title,
          slug: r.slug,
          coverUrl,
          mediaCount: r.recipe_media?.length ?? 0,
        }
      })

      setRecipes(mapped)
      setLoading(false)
    }

    fetchRecipes()
  }, [])

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-500">
        Loading your recipes…
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pb-16">
      <h2 className="my-12 text-center text-3xl font-bold text-gray-800">
        My Recipes
      </h2>

      {recipes.length === 0 ? (
        <p className="text-center text-gray-500">
          You haven’t uploaded any recipes yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map(({ id, title, slug, coverUrl, mediaCount }) => (
            <div
              key={id}
              onClick={() => router.push(`/recipes/${slug}`)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-[20px] bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg"
            >
              {/* Image */}
              <div className="flex h-[350px] w-full items-center justify-center overflow-hidden bg-gray-100">
                {coverUrl && (
                  <Image
                    src={coverUrl}
                    alt={title}
                    width={500}
                    height={500}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {title}
                </h3>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {mediaCount} media
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecipesFeed
