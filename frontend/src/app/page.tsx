import HeroSection from "@/components/index/HeroSection";
import PopularDestinations from "@/components/index/PopularDestinations";
import ServicesSection from "@/components/index/ServicesSection";
import TestimonialsSection from "@/components/index/TestimonialsSection";
import FeaturedTours from "@/components/index/FeaturedTours";
import NewsletterSection from "@/components/index/NewsletterSection";
import Footer from "@/components/index/Footer";
import Header from "@/components/index/Header";

const page = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4">
        <HeroSection />
        <PopularDestinations />
        <ServicesSection />
        <TestimonialsSection />
        <FeaturedTours />
        <NewsletterSection />
        <Footer />
      </div>
    </div>
  );
};

export default page;
