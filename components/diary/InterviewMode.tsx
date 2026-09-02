'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicIcon, BalloonIcon, HomeIcon, HeartIcon, SparkleIcon } from '@/components/ui/icons';

const INTERVIEW_TOPICS = [
  {
    id: 'childhood',
    icon: BalloonIcon,
    title: 'Childhood Memories',
    color: 'from-pink-500/20 to-purple-500/20',
    borderColor: 'border-pink-500/30',
    questions: [
      'What was your favorite game to play as a child?',
      'Describe your childhood home. What room did you love most?',
      'Who was your best friend growing up? What did you do together?',
      'What was your favorite meal that someone made for you?',
      'What sound or smell brings you back to your childhood?',
    ],
  },
  {
    id: 'family',
    icon: HomeIcon,
    title: 'Family Stories',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
    questions: [
      'What story does your family tell about you over and over?',
      'What tradition did your family have that you loved?',
      'Who taught you something important? What was it?',
      'What did your parents/grandparents do for work? What do you remember about it?',
      'What was the best advice someone in your family gave you?',
    ],
  },
  {
    id: 'love',
    icon: HeartIcon,
    title: 'Love & Connection',
    color: 'from-rose-500/20 to-red-500/20',
    borderColor: 'border-rose-500/30',
    questions: [
      'When did you first realize you loved someone?',
      'What moment made you feel most seen and understood?',
      'Who made you laugh the hardest? Tell that story.',
      'What small gesture of kindness do you still remember?',
      'What does home feel like to you?',
    ],
  },
  {
    id: 'lessons',
    icon: SparkleIcon,
    title: 'Life Lessons',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    questions: [
      'What challenge changed the way you see the world?',
      'What did you learn later in life that you wish you knew earlier?',
      'Who surprised you by their strength or kindness?',
      'What failure taught you the most?',
      'What are you most proud of?',
    ],
  },
];

export function InterviewMode() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const topic = INTERVIEW_TOPICS.find((t) => t.id === selectedTopic);
  const currentQuestion = topic?.questions[currentQuestionIndex];

  const handleNextQuestion = () => {
    if (topic && currentQuestionIndex < topic.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
  };

  const handleBack = () => {
    setSelectedTopic(null);
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-gray-300">
          <MicIcon size={24} />
        </span>
        <div>
          <h3 className="text-lg font-bold text-white">Interview Mode</h3>
          <p className="text-xs text-gray-400">
            Preserve memories through guided reflection
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedTopic ? (
          <motion.div
            key="topics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {INTERVIEW_TOPICS.map((topic) => (
              <motion.button
                key={topic.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTopic(topic.id)}
                className={`
                  p-4 rounded-xl text-left
                  bg-gradient-to-br ${topic.color}
                  border ${topic.borderColor}
                  transition-all hover:shadow-lg
                `}
              >
                <span className="mb-2 block text-gray-200">
                  <topic.icon size={26} />
                </span>
                <p className="font-bold text-white text-sm">{topic.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {topic.questions.length} prompts
                </p>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div
              className={`
              p-6 rounded-xl
              bg-gradient-to-br ${topic?.color}
              border ${topic?.borderColor}
            `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-200">
                  {topic && <topic.icon size={20} />}
                  <span className="text-sm font-bold text-white">
                    {topic?.title}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {currentQuestionIndex + 1} / {topic?.questions.length}
                </span>
              </div>

              <p className="text-lg font-medium text-white leading-relaxed">
                {currentQuestion}
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/20 transition-all"
              >
                ← Back
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextQuestion}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-black font-bold text-sm hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Next Question →
              </motion.button>
            </div>

            <div className="p-4 bg-black/30 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 text-center">
                Use this prompt to write a diary entry and preserve this memory
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
