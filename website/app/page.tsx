import Header from "@/components/nav/Header";
import Hero from "@/components/sections/Hero";
import RecognitionMoment from "@/components/sections/RecognitionMoment";
import HowItWorks from "@/components/sections/HowItWorks";
import Vibes from "@/components/sections/Vibes";
import LiveFeed from "@/components/sections/LiveFeed";
import Safety from "@/components/sections/Safety";
import ForGyms from "@/components/sections/ForGyms";
import FAQ from "@/components/sections/FAQ";
import FooterCTA from "@/components/sections/FooterCTA";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <RecognitionMoment />
        <HowItWorks />
        <Vibes />
        <LiveFeed />
        <Safety />
        <ForGyms />
        <FAQ />
      </main>
      <FooterCTA />
    </>
  );
}
