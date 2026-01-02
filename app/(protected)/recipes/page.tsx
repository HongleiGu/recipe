'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

import type {
  RecipeFull,
  TagCategory,
  Tag,
  RecipeMedia,
  Author,
} from '@/types/recipe'
import { FALLBACK_MEDIA } from '@/lib/utils'
import Link from 'next/link'

const CATEGORIES: { key: TagCategory; label: string }[] = [
  { key: 'ingredient', label: 'Ingredients' },
  { key: 'seasoning', label: 'Seasonings' },
  { key: 'technique', label: 'Techniques' },
]

export default function RecipesFeed() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [recipes, setRecipes] = useState<RecipeFull[]>([])
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [activeDrawer, setActiveDrawer] = useState<TagCategory | null>(null)
  const [input, setInput] = useState('')

  // ------------------------------
  // URL-driven state
  // ------------------------------
  const authorQuery = searchParams.get('author') ?? ''

  const selectedTags = useMemo<Record<TagCategory, string[]>>(() => {
    return {
      ingredient: searchParams.get('ingredient')?.split(',').filter(Boolean) ?? [],
      seasoning: searchParams.get('seasoning')?.split(',').filter(Boolean) ?? [],
      technique: searchParams.get('technique')?.split(',').filter(Boolean) ?? [],
    }
  }, [searchParams])

  // ------------------------------
  // Fetch recipes
  // ------------------------------
  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          slug,
          content,
          recipe_media(file_path, position, media_type),
          recipe_tags(tags(name, category)),
          author:author_id(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error || !data) return

      const mapped: RecipeFull[] = data.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        content: r.content,
        recipe_media: r.recipe_media.length == 0 ? [FALLBACK_MEDIA] : r.recipe_media as RecipeMedia[],
        tags: r.recipe_tags?.flatMap((rt) => rt.tags ?? []) ?? [],
        author: Array.isArray(r.author) ? r.author[0] : r.author as Author,
      }))

      setRecipes(mapped)
    }

    fetchRecipes()
  }, [])

  // ------------------------------
  // Tag suggestions
  // ------------------------------
  useEffect(() => {
    if (!activeDrawer || !input.trim()) return

    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('tags')
        .select('name, category')
        .eq('category', activeDrawer)
        .ilike('name', `%${input}%`)
        .limit(8)

      setSuggestions(data ?? [])
    }

    fetchSuggestions()
  }, [activeDrawer, input])

  // ------------------------------
  // Filtering logic
  // ------------------------------
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe: RecipeFull) => {
      // Author filter
      if (authorQuery) {
        const username = recipe.author.username ?? ''
        if (!username.toLowerCase().includes(authorQuery.toLowerCase())) return false
      }

      // Tag filters
      return CATEGORIES.every(({ key }) => {
        const required = selectedTags[key]
        if (!required.length) return true

        return required.every((name) =>
          recipe.tags.some((t) => t.category === key && t.name === name)
        )
      })
    })
  }, [recipes, selectedTags, authorQuery])

  // ------------------------------
  // URL helpers
  // ------------------------------
  const updateParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) params.delete(key)
    else params.set(key, value)
    router.push(`?${params.toString()}`)
  }

  const addTag = (tag: Tag) => {
    const current = selectedTags[tag.category]
    if (current.includes(tag.name)) return

    updateParam(tag.category, [...current, tag.name].join(','))
    setInput('')
    setSuggestions([])
  }

  // ------------------------------
  // Helpers
  // ------------------------------
  const getCoverUrl = (media: RecipeMedia[]) => {
    const cover = media?.[0]
    if (!cover) return null
    if (cover.default) {
      return cover.file_path
    }

    return supabase.storage
      .from('recipe-media')
      .getPublicUrl(cover.file_path).data.publicUrl
  }

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="container mx-auto px-4 pb-16">
      <div className="my-12 flex items-center justify-between">
        {/* Spacer to keep title centered */}
        <div className="w-24" />

        <h2 className="text-3xl font-bold text-center flex-1">
          Explore Recipes
        </h2>

        <div className="w-24 flex justify-end">
          <Link
            href="/recipes/upload"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            + Upload
          </Link>
        </div>
      </div>


      {/* ===== Search Panel ===== */}
      <div className="mb-10 space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        {/* Author search */}
        <div>
          <label className="mb-2 block text-sm font-semibold">Author</label>
          <input
            value={authorQuery}
            onChange={(e) =>
              updateParam('author', e.target.value || undefined)
            }
            placeholder="Search by author..."
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        {/* Tag filters */}
        {CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <button
              onClick={() =>
                setActiveDrawer(activeDrawer === key ? null : key)
              }
              className="mb-2 flex w-full items-center justify-between font-semibold"
            >
              {label}
              {!!selectedTags[key].length && (
                <span className="text-sm text-gray-400">
                  {selectedTags[key].length}
                </span>
              )}
            </button>

            <div className="flex flex-wrap gap-2">
              {selectedTags[key].map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm"
                >
                  {name}
                </span>
              ))}
            </div>

            {activeDrawer === key && (
              <div className="mt-3 rounded-xl border bg-gray-50 p-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="mb-3 w-full rounded-lg border px-3 py-2"
                />

                <div className="space-y-2">
                  {suggestions.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => addTag(tag)}
                      className="block w-full rounded-md px-3 py-2 text-left hover:bg-white"
                    >
                      {tag.name}
                    </button>
                  ))}
                  {!suggestions.length && (
                    <p className="text-sm text-gray-400">
                      No suggestions
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== Recipe Grid ===== */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRecipes.map((recipe) => {
          const coverUrl = getCoverUrl(recipe.recipe_media)

          return (
            <div
              key={recipe.id}
              onClick={() => router.push(`/recipes/${recipe.slug}`)}
              className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-[300px] overflow-hidden bg-gray-100">
                {coverUrl && (
                  <Image
                    src={coverUrl}
                    alt={recipe.title}
                    width={500}
                    height={500}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>

              <div className="p-5 text-center">
                <h3 className="text-lg font-bold">{recipe.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  by {recipe.author.username ?? 'Unknown'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
