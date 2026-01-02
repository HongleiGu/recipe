'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import TagInput from '@/components/TagInput'
import { upsertAndLinkTags, deleteRecipeById } from '@/lib/recipeActions'
import type { Tag } from '@/types/recipe'

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slugParam = params.slug

  const [recipeId, setRecipeId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const [ingredients, setIngredients] = useState<string[]>([])
  const [seasonings, setSeasonings] = useState<string[]>([])
  const [techniques, setTechniques] = useState<string[]>([])

  // Slugify helper
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

  // Load user + recipe
  useEffect(() => {
    const loadData = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push('/auth')
        return
      }
      setUserId(auth.user.id)

      const { data: recipe, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          content,
          author_id,
          recipe_tags (
            tags (name, category)
          )
        `)
        .eq('slug', slugParam)
        .single()

      if (error || !recipe) {
        alert('Recipe not found')
        router.push('/')
        return
      }

      if (recipe.author_id !== auth.user.id) {
        alert('You are not allowed to edit this recipe')
        router.push(`/recipes/${slugParam}`)
        return
      }

      setRecipeId(recipe.id)
      setTitle(recipe.title)
      setContent(recipe.content.replace(/\\n/g, '\n'))

      const tags = recipe.recipe_tags?.flatMap((rt) => rt.tags ?? []) ?? []

      setIngredients(tags.filter((t) => t.category === 'ingredient').map((t) => t.name))
      setSeasonings(tags.filter((t) => t.category === 'seasoning').map((t) => t.name))
      setTechniques(tags.filter((t) => t.category === 'technique').map((t) => t.name))
    }

    loadData()
  }, [slugParam, router])

  const handleSubmit = async () => {
    if (!title || !content) return alert('Title and content required')
    if (!userId || !recipeId) return alert('Invalid state')

    setLoading(true)

    // 🔥 1️⃣ Delete old recipe completely
    await deleteRecipeById(recipeId)

    const newSlug = slugify(title)

    // 🔥 2️⃣ Recreate recipe
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        title,
        slug: newSlug,
        content: content.replace(/\n/g, '\\n'),
        author_id: userId,
      })
      .select()
      .single()

    if (error || !recipe) {
      setLoading(false)
      return alert('Failed to update recipe')
    }

    // 🔥 3️⃣ Upload media
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const filePath = `recipes/${recipe.id}/${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('recipe-media')
        .upload(filePath, file)

      if (uploadError) {
        console.error(uploadError)
        continue
      }

      await supabase.from('recipe_media').insert({
        recipe_id: recipe.id,
        file_path: filePath,
        position: i,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
      })
    }

    // 🔥 4️⃣ Reinsert tags
    const allTags: Tag[] = [
      ...ingredients.map((name) => ({ name, category: 'ingredient' as const })),
      ...seasonings.map((name) => ({ name, category: 'seasoning' as const })),
      ...techniques.map((name) => ({ name, category: 'technique' as const })),
    ]

    await upsertAndLinkTags(recipe.id, allTags)

    setLoading(false)
    router.push(`/recipes/${newSlug}`)
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">Edit Recipe</h1>

      <div className="space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        {/* Title */}
        <div>
          <label className="mb-2 block font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        {/* Content */}
        <div>
          <label className="mb-2 block font-medium">Recipe Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full rounded-lg border px-4 py-2"
          />
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <TagInput category="ingredient" label="Ingredients" value={ingredients} onChange={setIngredients} />
          <TagInput category="seasoning" label="Seasonings" value={seasonings} onChange={setSeasonings} />
          <TagInput category="technique" label="Techniques" value={techniques} onChange={setTechniques} />
        </div>

        {/* Media */}
        <div>
          <label className="mb-2 block font-medium">Replace Media (optional)</label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <p className="mt-1 text-sm text-gray-500">
            Uploading files will replace existing media
          </p>
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
        >
          {loading ? 'Updating…' : 'Update Recipe'}
        </button>
      </div>
    </div>
  )
}
