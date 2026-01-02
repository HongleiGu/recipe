'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { TagCategory } from '@/types/recipe'

type Props = {
  category: TagCategory
  label: string
  value: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ category, label, value, onChange }: Props) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleInputChange = (text: string) => {
    setInput(text)

    if (!text.trim()) {
      setSuggestions([]) // ✅ move here instead of inside useEffect
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('category', category)
        .ilike('name', `%${text}%`)
        .limit(8)

      if (!error && data) {
        setSuggestions(
          data.map((t) => t.name).filter((name) => !value.includes(name))
        )
      }
    }, 250)
  }

  const addTag = (name: string) => {
    if (!value.includes(name)) {
      onChange([...value, name])
    }
    setInput('')
    setSuggestions([])
  }

  const removeTag = (name: string) => {
    onChange(value.filter((t) => t !== name))
  }

  return (
    <div className="space-y-2">
      <label className="block font-medium">{label}</label>

      <input
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={`Add ${label.toLowerCase()}`}
        className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring"
      />

      {/* Suggestions */}
      {input && (
        <div className="rounded-lg border bg-white shadow-sm">
          {suggestions.length > 0 ? (
            suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addTag(name)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50"
              >
                {name}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-400">No suggestions</p>
          )}

          {input && !value.includes(input) && !suggestions.includes(input) && (
            <button
              type="button"
              onClick={() => addTag(input)}
              className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 text-sm border-t"
            >
              + Create new tag “{input}”
            </button>
          )}
        </div>
      )}

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-gray-500 hover:text-black"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
