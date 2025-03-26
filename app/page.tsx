'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import PrimaryMood from '@/components/MoodJourney/PrimaryMood'
import SpecificMood from '@/components/MoodJourney/SpecificMood'
import Welcome from '@/components/Welcome'

export default function Home() {
  const { data: session } = useSession()
  const [step, setStep] = useState(1)
  const [moodData, setMoodData] = useState({
    primaryMood: '',
    specificMood: '',
    reason: '',
    activity: '',
  })

  if (!session) {
    return <Welcome />
  }

  const handlePrimaryMoodSelect = (mood: string) => {
    setMoodData({ ...moodData, primaryMood: mood })
    setStep(2)
  }

  const handleSpecificMoodSelect = (mood: string) => {
    setMoodData({ ...moodData, specificMood: mood })
    setStep(3)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {session.user?.name}
      </h1>
      
      {step === 1 && (
        <>
          <h2 className="text-xl mb-4">How are you feeling today?</h2>
          <PrimaryMood onSelect={handlePrimaryMoodSelect} />
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl mb-4">More specifically, how do you feel?</h2>
          <SpecificMood
            primaryMood={moodData.primaryMood}
            onSelect={handleSpecificMoodSelect}
          />
        </>
      )}
    </main>
  )
} 