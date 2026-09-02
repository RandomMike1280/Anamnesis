'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon, SparkleIcon, UsersIcon, BookIcon, CheckCircleIcon } from '@/components/ui/icons';
import { StaticStarfield } from '@/components/backgrounds/StaticStarfield';
import { useRouter } from 'next/navigation';

const TIERS = [
  {
    name: 'Free',
    price: '0₫',
    period: 'forever',
    icon: StarIcon,
    accent: 'from-gray-400/10 to-gray-500/5',
    border: 'border-white/10',
    glow: '',
    features: [
      'Unlimited diary entries',
      'End-to-end encryption',
      'Your star in the shared sky',
      'AI mood analysis (daily)',
      'Basic calendar view',
    ],
  },
  {
    name: 'Premium',
    price: '59,000₫',
    period: 'per month',
    icon: SparkleIcon,
    accent: 'from-violet-600/20 to-purple-800/15',
    border: 'border-violet-500/40',
    glow: 'shadow-2xl shadow-violet-500/20',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited Memory Capsules',
      'Interview Mode prompts',
      'Advanced mood insights',
      'Custom star appearance',
      'Priority support',
      'Export entries (PDF / JSON)',
    ],
  },
  {
    name: 'Family Memory',
    price: '149,000₫',
    period: 'per month',
    icon: UsersIcon,
    accent: 'from-amber-600/15 to-orange-800/10',
    border: 'border-amber-500/25',
    glow: '',
    features: [
      'Everything in Premium',
      'Up to 5 family accounts',
      'Shared memory timeline',
      'Collaborative capsules',
      'Family story builder',
      'Shared photo vault (5 GB)',
    ],
  },
  {
    name: 'Memory Book',
    price: '499,000₫',
    period: 'one-time',
    icon: BookIcon,
    accent: 'from-emerald-600/15 to-teal-800/10',
    border: 'border-emerald-500/25',
    glow: '',
    features: [
      'Professional printed book',
      'Premium hardcover binding',
      'Custom cover design',
      'Photo integration',
      'Up to 200 pages',
      'Free worldwide shipping',
      'Beautiful gift packaging',
    ],
  },
];

const FAQS = [
  {
    q: 'Is my data really private?',
    a: 'Yes. All diary entries are encrypted on your device before being stored. We cannot read your entries — only you hold the key.',
  },
  {
    q: 'Can I switch plans anytime?',
    a: 'Absolutely. Upgrade, downgrade, or cancel at any time. No long-term contracts, no questions asked.',
  },
  {
    q: 'What happens if I cancel Premium?',
    a: 'You keep all your entries and can still read them. Premium features (capsules, exports, etc.) become locked until you resubscribe.',
  },
  {
    q: 'How does the Memory Book work?',
    a: 'Select entries to include, customise the design, and we print and ship a beautiful hardcover book to your door within 2–3 weeks.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <StaticStarfield />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-24">

        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Home
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-5 max-w-2xl mx-auto"
        >
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-gray-500">
            Plans & Pricing
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif">
            Choose Your Journey
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Start free forever. Upgrade anytime to unlock deeper ways to preserve
            and share your memories.
          </p>
        </motion.div>

        {/* Tier grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`
                relative rounded-3xl p-6 border flex flex-col
                bg-gradient-to-br ${tier.accent} ${tier.border} ${tier.glow}
                ${tier.highlight ? 'ring-1 ring-violet-500/30' : ''}
              `}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-[10px] font-black tracking-widest uppercase text-white whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="flex-1 space-y-7">
                {/* Tier header */}
                <div className="text-center space-y-4 pt-2">
                  <div className="flex justify-center">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <tier.icon size={36} className="text-gray-200" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{tier.name}</h3>
                    <div className="mt-3 space-y-0.5">
                      <p className="text-3xl font-black text-white">{tier.price}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">{tier.period}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2.5">
                      <CheckCircleIcon size={16} className="flex-shrink-0 mt-0.5 text-gray-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  mt-8 w-full py-3.5 rounded-full font-bold text-sm transition-all
                  ${tier.highlight
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/40'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }
                `}
              >
                {tier.name === 'Free' ? 'Get Started' : tier.name === 'Memory Book' ? 'Order Now' : 'Choose Plan'}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <h2 className="text-3xl font-serif text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <p className="font-medium text-white text-sm leading-snug">{faq.q}</p>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 text-gray-500 text-xl leading-none"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-6 pb-8"
        >
          <p className="text-gray-500 text-sm">Start writing tonight — it&apos;s free, always.</p>
          <motion.a
            href="/auth"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block px-12 py-5 bg-white text-black rounded-full font-medium text-base hover:bg-gray-100 transition-colors"
          >
            Create Your Account
          </motion.a>
        </motion.div>

      </div>
    </main>
  );
}
