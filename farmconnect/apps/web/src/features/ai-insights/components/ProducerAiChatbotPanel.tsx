import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bot, CornerDownLeft, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '@/shared/utils/api-error';

import { useAiChatbot } from '../hooks/useAiInsights';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
}

function makeMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ProducerAiChatbotPanel() {
  const { t } = useTranslation();
  const chatbotMutation = useAiChatbot();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeMessageId(),
      role: 'assistant',
      text: t('ai.chatbotStarter'),
      suggestions: [
        t('ai.chatSuggestionPrice'),
        t('ai.chatSuggestionStock'),
        t('ai.chatSuggestionDemand'),
      ],
    },
  ]);

  const latestSuggestions = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const current = messages[index];
      if (!current) continue;
      if (current.role === 'assistant' && current.suggestions && current.suggestions.length > 0) {
        return current.suggestions;
      }
    }
    return [];
  }, [messages]);

  async function submitMessage(nextMessage?: string) {
    const message = (nextMessage ?? input).trim();
    if (!message || chatbotMutation.isPending) return;

    setInput('');
    setMessages((prev) => [...prev, { id: makeMessageId(), role: 'user', text: message }]);

    try {
      const reply = await chatbotMutation.mutateAsync({
        message,
        role: 'PRODUCER',
        context: { surface: 'producer-ai-insights' },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: makeMessageId(),
          role: 'assistant',
          text: reply.answer,
          suggestions: reply.followUpSuggestions,
        },
      ]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('ai.chatError')));
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('ai.chatbotTitle')}</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('ai.chatbotSubtitle')}</p>
        </div>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          {t('ai.chatbotBadge')}
        </span>
      </header>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/60">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' ? (
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Bot className="h-3.5 w-3.5" />
              </span>
            ) : null}

            <p
              className={[
                'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
              ].join(' ')}
            >
              {message.text}
            </p>

            {message.role === 'user' ? (
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                <UserRound className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        ))}

        {chatbotMutation.isPending ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('ai.thinking')}</p>
        ) : null}
      </div>

      {latestSuggestions.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {latestSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-[11px] text-gray-700 hover:border-primary-400 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-500 dark:hover:text-primary-300"
              onClick={() => {
                void submitMessage(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submitMessage();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('ai.chatbotPlaceholder')}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={chatbotMutation.isPending || !input.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
          {t('ai.send')}
        </button>
      </form>
    </section>
  );
}