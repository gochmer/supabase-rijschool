import { Reveal } from "@/components/marketing/homepage-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MarketingFaqItem = {
  question: string;
  answer: string;
};

type MarketingFaqSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: MarketingFaqItem[];
};

export function MarketingFaqSection({
  eyebrow,
  title,
  description,
  items,
}: MarketingFaqSectionProps) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="site-shell mx-auto w-full px-4 pt-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Reveal className="space-y-5">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {title}
          </h2>
          <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.question}
              className="rounded-[1.6rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.88),rgba(30,41,59,0.82),rgba(15,23,42,0.9))] dark:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.52)]"
            >
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl leading-tight">
                  {item.question}
                </CardTitle>
                <CardDescription className="text-sm leading-7">
                  {item.answer}
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
