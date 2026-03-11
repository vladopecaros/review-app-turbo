'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Tab = 'cli' | 'jsx';

export function Hero() {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>('cli');

  return (
    <section className="grid-lines relative overflow-hidden border-b border-white/5">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-24">
        <div className="space-y-6">
          <Badge className="animate-fade-up">{t('hero.badge')}</Badge>

          <div className="space-y-3">
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-bold leading-tight tracking-tight text-[color:var(--text)] sm:text-5xl lg:text-6xl">
              <span className="block">{t('hero.headlineLine1')}</span>
              <span className="block text-blue-300">{t('hero.headlineLine2')}</span>
            </h1>
            <p className="animate-fade-up-delay-2 max-w-xl text-base leading-7 text-[color:var(--text-muted)] sm:text-lg">
              {t('hero.sub')}
            </p>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg">{t('hero.cta')}</Button>
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Button variant="outline" size="lg">
                {t('hero.ctaSecondary')}
              </Button>
            </a>
          </div>
        </div>

        <div className="surface-panel animate-fade-up-delay-2 overflow-hidden p-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-[color:var(--border)] px-3 py-2.5">
            <button
              onClick={() => setTab('cli')}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                tab === 'cli'
                  ? 'bg-white/10 text-[color:var(--text)]'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)]',
              ].join(' ')}
            >
              {t('hero.snippetTitle')}
            </button>
            <button
              onClick={() => setTab('jsx')}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                tab === 'jsx'
                  ? 'bg-white/10 text-[color:var(--text)]'
                  : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)]',
              ].join(' ')}
            >
              {t('hero.snippetTab2')}
            </button>
            <span className="ml-auto font-mono text-xs text-[color:var(--text-muted)]">
              {tab === 'cli' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </span>
          </div>

          {/* Code panel — key forces re-mount on tab switch, triggering CSS animation */}
          {tab === 'cli' ? (
            <div key="cli" className="code-fade code-panel-enter">
              <pre className="overflow-x-auto p-4 text-sm leading-7 font-mono text-[color:var(--text)]">
                <code>
                  <span className="text-zinc-500">{'# 1. Configure once'}</span>
                  {'\n'}
                  <span className="text-[color:var(--text-muted)] select-none">$ </span>
                  <span className="text-blue-300">npx</span>
                  <span className="text-zinc-300"> @reviewlico/cli </span>
                  <span className="text-emerald-300">init</span>
                  {'\n'}
                  <span className="text-zinc-500">{'  ✓ Detected Next.js · Tailwind'}</span>
                  {'\n\n'}
                  <span className="text-zinc-500">{'# 2. Copy component source into your project'}</span>
                  {'\n'}
                  <span className="text-[color:var(--text-muted)] select-none">$ </span>
                  <span className="text-blue-300">npx</span>
                  <span className="text-zinc-300"> @reviewlico/cli </span>
                  <span className="text-emerald-300">add</span>
                  <span className="text-amber-200"> ReviewForm</span>
                  {'\n'}
                  <span className="text-zinc-500">{'  ✓ Copied ReviewForm.tsx → components/reviews/'}</span>
                  {'\n'}
                  <span className="text-zinc-500">{'  ✓ Copied StarRating.tsx → components/reviews/'}</span>
                  {'\n\n'}
                  <span className="text-zinc-500">{'# 3. Set two env vars and you\'re done'}</span>
                  {'\n'}
                  <span className="text-amber-200">NEXT_PUBLIC_REVIEWLICO_API_URL</span>
                  <span className="text-zinc-400">=https://api.reviewlico.dev</span>
                  {'\n'}
                  <span className="text-amber-200">NEXT_PUBLIC_REVIEWLICO_API_KEY</span>
                  <span className="text-zinc-400">=rk_your_key_here</span>
                </code>
              </pre>
            </div>
          ) : (
            <div key="jsx" className="code-fade code-panel-enter">
              <pre className="overflow-x-auto p-4 text-sm leading-7 font-mono text-[color:var(--text)]">
                <code>
                  <span className="text-zinc-500">{'// components/reviews/ReviewForm.tsx is yours to edit'}</span>
                  {'\n'}
                  <span className="text-blue-300">import</span>
                  <span className="text-zinc-300">{' { ReviewForm } '}</span>
                  <span className="text-blue-300">from</span>
                  <span className="text-amber-200">{" './components/reviews/ReviewForm'"}</span>
                  {'\n\n'}
                  <span className="text-blue-300">export default function</span>
                  <span className="text-emerald-300"> ProductPage</span>
                  <span className="text-zinc-300">{'() {'}</span>
                  {'\n'}
                  <span className="text-zinc-300">{'  '}</span>
                  <span className="text-blue-300">return</span>
                  <span className="text-zinc-300"> {'('}</span>
                  {'\n'}
                  <span className="text-zinc-300">{'    '}</span>
                  <span className="text-emerald-300">{'<ReviewForm'}</span>
                  {'\n'}
                  <span className="text-zinc-300">{'      '}</span>
                  <span className="text-blue-300">externalProductId</span>
                  <span className="text-zinc-300">={'"'}</span>
                  <span className="text-amber-200">your-product-slug</span>
                  <span className="text-zinc-300">{'"'}</span>
                  {'\n'}
                  <span className="text-emerald-300">{'    />'}</span>
                  {'\n'}
                  <span className="text-zinc-300">{'  )'}</span>
                  {'\n'}
                  <span className="text-zinc-300">{'}'}</span>
                </code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
