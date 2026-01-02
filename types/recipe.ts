export type MediaType = 'image' | 'video'
export type TagCategory = 'ingredient' | 'seasoning' | 'technique'

export interface Tag {
  name: string
  category: TagCategory
}

export type RecipeMedia = {
  file_path: string
  position: number
  media_type?: MediaType
}

/**
 * Used by feed / cards
 */
export type RecipePreview = {
  id: string
  title: string
  slug: string
  recipe_media: RecipeMedia[]
}

export type Author = {
  id: string
  username: string | null
  avatar_url: string | null
}

export type RecipeFull = {
  id: string
  title: string
  slug: string
  content: string
  recipe_media: RecipeMedia[]
  tags: Tag[]
  author: Author
}


export type UserRecipePreview = {
  id: string
  title: string
  slug: string
  created_at: string
}

export type UserProfile = {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  recipes: UserRecipePreview[]
}