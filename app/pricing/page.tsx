'use client';

import { motion } from 'framer-motion';
import { StarIcon, SparkleIcon, UsersIcon, BookIcon } from '@/components/ui/icons';

const TIERS = [
  {
    name: 'Free',
    price: '0₫',
    period: 'forever',
    icon: StarIcon,
    gradient: 'from-gray-800/40 to-gray-900/30',
    borderColor: 'border-gray-600/30',
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
    gradient: 'from-violet-900/40 to-purple-900/30',
    borderColor: 'border-violet-500/40',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited Memory Capsules',
      'Interview Mode prompts',
      'Advanced mood insights',
      'Custom star appearance',
      'Priority support',
      'Export all entries (PDF/JSON)',
    ],
  },
  {
    name: 'Family Memory',
    price: '149,000₫',
    period: 'per month',
    icon: UsersIcon,
    gradient: 'from-amber-900/40 to-orange-900/30',
    borderColor: 'border-amber-500/30',
    features: [
      'Everything in Premium',
      'Up to 5 family accounts',
      'Shared memory timeline',
      'Collaborative capsules',
      'Family story builder',
      'Shared photo vault (5GB)',
    ],
  },
  {
    name: 'Memory Book',
    price: '499,000₫',
    period: 'one-time',
    icon: BookIcon,
    gradient: 'from-emerald-900/40 to-teal-900/30',
    borderColor: 'border-emerald-500/30',
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

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(72,201,176,0.12),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 py-20 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-serif text-white"
          >
            Choose Your Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 leading-relaxed"
          >
            Start free forever. Upgrade anytime to unlock deeper ways to preserve
            and share your memories.
          </motion.p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative rounded-2xl p-6 border
                bg-gradient-to-br ${tier.gradient} ${tier.borderColor}
                ${tier.highlight ? 'ring-2 ring-violet-500/50' : ''}
              `}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-xs font-bold text-white">
                  MOST POPULAR
                </div>
              )}

              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                  <div className="flex justify-center text-gray-200">
                    <tier.icon size={44} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    <div className="mt-3">
                      <span className="text-3xl font-black text-white">
                        {tier.price}
                      </span>
                      <span className="text-xs text-gray-400 block mt-1">
                        {tier.period}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    w-full py-3 rounded-xl font-bold text-sm transition-all
                    ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/40'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }
                  `}
                >
                  {tier.name === 'Free' ? 'Get Started' : 'Choose Plan'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-20 space-y-6">
          <h2 className="text-2xl font-serif text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is my data really private?',
                a: 'Yes. All diary entries are encrypted on your device before being stored. We cannot read your entries—only you have the key.',
              },
              {
                q: 'Can I switch plans anytime?',
                a: 'Absolutely. Upgrade, downgrade, or cancel anytime. No long-term contracts.',
              },
              {
                q: 'What happens if I cancel Premium?',
                a: 'You keep all your entries and can still read them. Premium features (capsules, exports, etc.) become locked until you resubscribe.',
              },
              {
                q: 'How does the Memory Book work?',
                a: 'Select entries to include, customize the design, and we print and ship a beautiful hardcover book to your door within 2–3 weeks.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="font-bold text-white text-sm mb-2">{faq.q}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
