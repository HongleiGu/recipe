'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TagInput from '@/components/TagInput';
import { upsertAndLinkTags } from '@/lib/recipeActions';

export default function UploadRecipePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const [ingredients, setIngredients] = useState<string[]>([])
  const [seasonings, setSeasonings] = useState<string[]>([])
  const [techniques, setTechniques] = useState<string[]>([])


  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

  const handleSubmit = async () => {
    if (!title || !content) return alert('Title and content required');

    setLoading(true);

    const slug = slugify(title);

    // 1️⃣ Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title,
        slug,
        content,
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      setLoading(false);
      return alert('Failed to create recipe');
    }

    // 2️⃣ Upload media files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const filePath = `recipes/${recipe.id}/${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        continue;
      }

      await supabase.from('recipe_media').insert({
        recipe_id: recipe.id,
        file_path: filePath,
        position: i,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
      });
    }

    const allTags = [
      ...ingredients.map((name) => ({ name, category: 'ingredient' as const })),
      ...seasonings.map((name) => ({ name, category: 'seasoning' as const })),
      ...techniques.map((name) => ({ name, category: 'technique' as const })),
    ]

    await upsertAndLinkTags(recipe.id, allTags)


    setLoading(false);
    router.push(`/recipes/${slug}`);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">Upload Recipe</h1>

      <div className="space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        {/* Title */}
        <div>
          <label className="mb-2 block font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring"
            placeholder="No-oven soy sauce chicken"
          />
        </div>

        {/* Content */}
        <div>
          <label className="mb-2 block font-medium">Recipe Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring"
            placeholder={`Ingredients:\n\nSteps:\n\nTips:`}
          />
          <TagInput
            category="ingredient"
            label="Ingredients"
            value={ingredients}
            onChange={setIngredients}
          />

          <TagInput
            category="seasoning"
            label="Seasoning"
            value={seasonings}
            onChange={setSeasonings}
          />

          <TagInput
            category="technique"
            label="Technique"
            value={techniques}
            onChange={setTechniques}
          />

        </div>



        {/* Media */}
        <div>
          <label className="mb-2 block font-medium">Images / Videos</label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload multiple images or videos (order matters)
          </p>
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Uploading…' : 'Publish Recipe'}
        </button>
      </div>
    </div>
  );
}
