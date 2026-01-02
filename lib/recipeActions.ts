import { supabase } from '@/lib/supabaseClient'
import { RecipeFull } from '@/types/recipe'
import { TagCategory } from '@/types/recipe'


export async function getRecipeBySlug(slug: string): Promise<RecipeFull | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id,
      title,
      slug,
      content,
      recipe_media (
        file_path,
        position,
        media_type
      ),
      recipe_tags (
        tags (
          name,
          category
        )
      ),
      author:profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    content: data.content,
    recipe_media: data.recipe_media ?? [],
    tags:
      data.recipe_tags?.map((rt) => {
        const tag = Array.isArray(rt.tags) ? rt.tags[0] : rt.tags
        return {
          name: tag.name,
          category: tag.category,
        }
      }) ?? [],
    author: Array.isArray(data.author) ? data.author[0] : data.author
  }
}

export async function deleteRecipeById(recipeId: string) {
  const bucket = 'recipe-media'
  const folder = `${recipeId}`

  // 1️⃣ List files in the recipe folder
  const { data: files, error: listError } = await supabase.storage
    .from(bucket)
    .list(folder)

  if (listError) {
    console.error('Failed to list storage files', listError)
  }

  // 2️⃣ Delete files if any
  if (files && files.length > 0) {
    const paths = files.map((file) => `${folder}/${file.name}`)

    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (deleteError) {
      console.error('Failed to delete storage files', deleteError)
    }
  }

  // 3️⃣ Delete media records
  await supabase.from('recipe_media').delete().eq('recipe_id', recipeId)

  // 4️⃣ Delete recipe
  await supabase.from('recipes').delete().eq('id', recipeId)
}


export async function upsertAndLinkTags(
  recipeId: string,
  tags: { name: string; category: TagCategory }[]
) {
  if (tags.length === 0) return

  // 1. Upsert tags
  const { data: tagRows, error: tagError } = await supabase
    .from('tags')
    .upsert(
      tags.map((t) => ({
        name: t.name,
        category: t.category,
      })),
      { onConflict: 'name,category' }
    )
    .select()

  if (tagError || !tagRows) throw tagError

  // 2. Link to recipe
  const links = tagRows.map((tag) => ({
    recipe_id: recipeId,
    tag_id: tag.id,
  }))

  const { error: linkError } = await supabase
    .from('recipe_tags')
    .insert(links)

  if (linkError) throw linkError
}

