import { CtaBanner } from '@/components/marketing/CtaBanner';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { Footer } from '@/components/marketing/Footer';
import { Hero } from '@/components/marketing/Hero';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Navbar } from '@/components/marketing/Navbar';

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
