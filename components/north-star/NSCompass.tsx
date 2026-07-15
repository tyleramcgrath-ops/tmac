'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'

const suggestedQuestions = [
  'What should I focus on this week?',
  'Am I wasting money anywhere?',
  'Should I advertise right now?',
  'Do I need Instagram?',
  "Why aren't more people calling?",
  'What changed since the last check?',
  'What should I ignore?',
]

export function NSCompass({ scenario }: { scenario: PreviewScenario }) {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'compass'; text: string }>>([])
  const [isThinking, setIsThinking] = useState(false)

  const handleSendMessage = (text?: string) => {
    const toSend = text || message
    if (!toSend.trim()) return

    setConversation((prev) => [...prev, { role: 'user', text: toSend }])
    setMessage('')
    setIsThinking(true)

    // Simulate Compass thinking and responding
    setTimeout(() => {
      const response = generateCompassResponse(toSend, scenario)
      setConversation((prev) => [...prev, { role: 'compass', text: response }])
      setIsThinking(false)
    }, 1500)
  }

  const generateCompassResponse = (question: string, scenario: PreviewScenario): string => {
    const lowerQ = question.toLowerCase()

    if (lowerQ.includes('focus') || lowerQ.includes('week')) {
      return `Based on what I've seen, you should focus on one thing: ${scenario.opportunity?.headline || 'improving customer reach'}. This is evidence-based — not a guess. Everything else can wait.`
    }
    if (lowerQ.includes('waste') || lowerQ.includes('money')) {
      return `I don't have access to your spending yet, but once connected to your analytics, I can tell you exactly where your money is going and whether it's working. For now, I'd need that connection.`
    }
    if (lowerQ.includes('advertise')) {
      return `Not yet. Fix the foundation first — make sure customers can reach you reliably. Advertising amplifies problems; it doesn't hide them. Once that's solid, we can talk about growth.`
    }
    if (lowerQ.includes('instagram') || lowerQ.includes('social')) {
      return `Instagram is noise unless it solves a specific business problem. For a plumbing business, the fundamental problem is: can customers find you when they need you? Solve that first.`
    }
    if (lowerQ.includes('call')) {
      return `That's worth investigating. Are they looking for you but can't find you? Are they finding you but can't reach your phone? Those are two very different problems with different solutions.`
    }
    if (lowerQ.includes('changed') || lowerQ.includes('since')) {
      return scenario.briefing.materialChange
        ? `Yes — something moved. Your business shifted in a meaningful way since we last looked. That's why there's one thing worth your attention today.`
        : `No material changes. Your business is stable. That's actually good news — it means what you're doing is working.`
    }
    if (lowerQ.includes('ignore')) {
      return `Everything except: ${scenario.opportunity?.headline || 'customer reach'}. Ignore the rest. Most business software will scare you with a thousand metrics. I'm only telling you about things that actually matter to your business.`
    }

    return `That's a good question. To answer it well, I'd need more information about your business. What specific problem are you trying to solve?`
  }

  return (
    <section className="ns-compass-section border-t border-[var(--rf-card-line)]/30 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl">
        {/* Section header */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-4">Ask Compass</h2>
          <p className="text-base text-[var(--rf-text-secondary)] font-light">
            Ask a real business question. Compass responds like someone who knows your business.
          </p>
        </div>

        {/* Conversation thread */}
        {conversation.length > 0 && (
          <div className="mb-8 space-y-6">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md rounded-lg px-4 py-3 sm:px-5 sm:py-4 ${
                    msg.role === 'user'
                      ? 'bg-[var(--rf-blue-bright)] text-white'
                      : 'bg-white/3 border border-[var(--rf-card-line)]/50 text-[var(--rf-text-secondary)]'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white/3 border border-[var(--rf-card-line)]/50 rounded-lg px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-[var(--rf-blue-bright)] animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-[var(--rf-blue-bright)] animate-pulse delay-100" />
                    <div className="h-2 w-2 rounded-full bg-[var(--rf-blue-bright)] animate-pulse delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message input */}
        <div className="mb-8 sm:mb-12 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="What are you worried about?"
              className="flex-1 rounded-lg border border-[var(--rf-card-line)] bg-white/5 px-4 py-3 text-sm text-white placeholder-[var(--rf-faint)] focus:border-[var(--rf-blue-bright)] focus:outline-none focus:ring-1 focus:ring-[var(--rf-blue-bright)]/30 transition-all"
              disabled={isThinking}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || isThinking}
              className="flex-shrink-0 rounded-lg bg-[var(--rf-blue-bright)] p-3 text-white transition-all hover:bg-[var(--rf-blue-bright)]/90 disabled:bg-[var(--rf-card-line)] disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Suggested questions */}
          {conversation.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)]">Or try:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestedQuestions.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="rounded-lg border border-[var(--rf-card-line)]/50 bg-white/3 px-3 py-2 text-xs text-[var(--rf-text-secondary)] transition-all hover:bg-white/5 hover:border-[var(--rf-blue-bright)]/50 text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ns-compass-section {
          animation: compass-fade-in 0.8s ease-out 1.1s both;
        }

        @keyframes compass-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  )
}
