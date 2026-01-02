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

export default function TagInput({
  category,
  label,
  value,
  onChange,
}: Props) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = (text: string) => {
    setInput(text)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!text.trim()) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('category', category)
        .ilike('name', `%${text}%`)
        .limit(8)

      if (!error && data) {
        setSuggestions(
          data
            .map((t) => t.name)
            .filter((name) => !value.includes(name))
        )
      }
    }, 300)
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
    <div className="relative space-y-2">
      {/* Label */}
      <label className="block font-medium">{label}</label>

      {/* Input */}
      <input
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Add ${label.toLowerCase()}`}
        className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring"
      />

      {/* Drawer Suggestions */}
      {(suggestions.length > 0 || input != '') && (
        <div
          className="
            absolute left-0 right-0 z-20 mt-2
            max-h-56 overflow-y-auto
            rounded-xl border bg-white shadow-lg
          "
        >
          <div className="px-4 py-2 text-xs font-semibold text-gray-500">
            Suggestions
          </div>

          <div className="divide-y">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addTag(name)}
                className="
                  w-full px-4 py-2 text-left
                  hover:bg-gray-50
                "
              >
                {name}
              </button>
            ))}
          </div>

          {/* Create new tag */}
          {input &&
            !suggestions.includes(input) &&
            !value.includes(input) && (
              <div className="border-t">
                <button
                  type="button"
                  onClick={() => addTag(input)}
                  className="
                    w-full px-4 py-2 text-left text-sm
                    text-blue-600 hover:bg-blue-50
                  "
                >
                  + Create new tag “{input}”
                </button>
              </div>
            )}
        </div>
      )}

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="
                flex items-center gap-1
                rounded-full bg-gray-200
                px-3 py-1 text-sm
              "
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
