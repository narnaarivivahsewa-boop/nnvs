import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import WhyChoose from "@/components/WhyChoose";
import FeaturedProfilesNew from "@/components/FeaturedProfilesNew";
import SearchBox from "@/components/SearchBox";
import Stats from "@/components/Stats";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      
      <Hero />

      <SearchBox />

      <Stats />
      <FeaturedProfilesNew />
      <WhyChoose />
      <HowItWorks />
      <Footer />
    </>
  );
}