"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, MapPin, Star } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/assets/hero-travel.jpg)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      {/* Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="text-center lg:text-left space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30 text-foreground"
              >
                <Star className="w-4 h-4 fill-current text-accent" />
                <span className="text-sm font-medium">
                  Rated 4.9/5 by 10,000+ travelers
                </span>
              </motion.div>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
                  Discover Your Next
                  <span className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Adventure
                  </span>
                </h1>
              </motion.div>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Embark on extraordinary journeys to breathtaking destinations.
                Create memories that last a lifetime with our expertly crafted
                travel experiences.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link href="#tours" passHref>
                  <Button
                    size="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300 text-base px-6 py-3 group relative overflow-hidden cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center">
                      Explore Tours
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </Link>

                <Link href="/login" passHref>
                  <Button
                    size="default"
                    variant="outline"
                    className="border border-border bg-card/80 backdrop-blur-md text-foreground hover:bg-card/95 hover:border-primary/50 hover:text-foreground transition-all duration-300 text-base px-6 py-3 group cursor-pointer"
                  >
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Watch Stories
                  </Button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 pt-4"
              >
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">
                    200+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Destinations
                  </div>
                </div>
                <div className="w-px h-12 bg-border hidden sm:block" />
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">
                    50K+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Happy Travelers
                  </div>
                </div>
                <div className="w-px h-12 bg-border hidden sm:block" />
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">
                    98%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Satisfaction
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column (Destinations) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:grid grid-cols-2 gap-4 auto-rows-fr"
            >
              {[
                { name: "Bali, Indonesia", image: "🏝️", price: "$899" },
                { name: "Paris, France", image: "🗼", price: "$1,299" },
                { name: "Tokyo, Japan", image: "🏯", price: "$1,499" },
                { name: "Dubai, UAE", image: "🏙️", price: "$1,099" },
              ].map((destination, index) => (
                <motion.div
                  key={destination.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="group relative bg-card/80 backdrop-blur-md border border-border rounded-xl p-4 hover:bg-card/95 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-4xl mb-2">{destination.image}</div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-card-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                        {destination.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        From {destination.price}
                      </p>
                    </div>
                    <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-muted-foreground"
      >
        <span className="text-xs font-medium uppercase tracking-wider">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-border rounded-full flex justify-center p-1"
        >
          <div className="w-1.5 h-3 bg-foreground/40 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Decorative Blurs */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
    </section>
  );
};

export default HeroSection;
