'use client'

import { motion } from 'framer-motion'

const specificMoods = {
  happy: ['excited', 'content', 'peaceful', 'grateful'],
  normal: ['calm', 'neutral', 'stable', 'balanced'],
  unhappy: ['stressed', 'anxious', 'sad', 'exhausted'],
}

export default function SpecificMood({
  primaryMood,
  onSelect,
}: {
  primaryMood: string
  onSelect: (mood: string) => void
}) {
  const moods = specificMoods[primaryMood as keyof typeof specificMoods] || []

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {moods.map((mood) => (
        <motion.button
          key={mood}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(mood)}
          className="p-4 rounded-lg bg-white shadow hover:shadow-lg transition-all"
        >
          {mood}
        </motion.button>
      ))}
    </div>
  )
} 