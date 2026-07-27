import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import WhyChoose from "@/components/WhyChoose";
import FeaturedProfiles from "@/components/FeaturedProfiles";
import SearchBox from "@/components/SearchBox";
import Stats from "@/components/Stats";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <SearchBox />

      <Stats />
      <FeaturedProfiles />
      <WhyChoose />
      <HowItWorks />
      <Footer />
    </>
  );
}