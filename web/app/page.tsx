import { Hero } from "@/components/Hero";
import { StatsRow } from "@/components/StatsRow";
import { HowItWorks } from "@/components/HowItWorks";
import { FeatureGrid } from "@/components/FeatureGrid";
import { CTA } from "@/components/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsRow />
      <HowItWorks />
      <FeatureGrid />
      <CTA />
    </>
  );
}
