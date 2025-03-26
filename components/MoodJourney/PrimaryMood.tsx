'use client'

import { motion } from 'framer-motion'

const moods = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'normal', emoji: '😐', label: 'Normal' },
  { id: 'unhappy', emoji: '😔', label: 'Unhappy' },
]

export default function PrimaryMood({ onSelect }: { onSelect: (mood: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {moods.map((mood) => (
        <motion.button
          key={mood.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(mood.id)}
          className="p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <div className="text-4xl mb-2">{mood.emoji}</div>
          <div className="text-lg font-medium">{mood.label}</div>
        </motion.button>
      ))}
    </div>
  )
} 