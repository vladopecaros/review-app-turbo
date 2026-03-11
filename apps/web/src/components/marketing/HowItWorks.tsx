import { useTranslations } from 'next-intl';

type StepItem = {
  title: string;
  description: string;
  command?: string;
};

export function HowItWorks() {
  const t = useTranslations();
  const steps = t.raw('howItWorks.steps') as StepItem[];

  return (
    <section id="how-it-works" className="border-y border-white/5 bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8 space-y-2">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t('howItWorks.title')}</h2>
          <p className="text-[color:var(--text-muted)]">{t('howItWorks.subtitle')}</p>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="surface-panel relative p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/10 text-sm font-semibold text-blue-200">
                  {index + 1}
                </span>
                <div className="h-px flex-1 bg-[color:var(--border)] md:hidden" />
              </div>
              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{step.description}</p>
              {step.command ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2">
                  <span className="select-none font-mono text-xs text-[color:var(--text-muted)]">$</span>
                  <span className="font-mono text-xs text-emerald-300">{step.command}</span>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
