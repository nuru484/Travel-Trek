"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ArrowRight, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { destinations } from "@/static-data/destinations";

const PopularDestinations = () => {
  return (
    <section id="destinations" className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Badge
              variant="outline"
              className="mb-4 border-accent/20 text-accent bg-accent/5"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending Now
            </Badge>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Popular Destinations
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover the world&apos;s most breathtaking locations, carefully
            selected for unforgettable experiences
          </p>
        </motion.div>

        {/* Destinations Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              viewport={{ once: true, margin: "-50px" }}
              className="group h-full"
            >
              <Card className="overflow-hidden border border-border bg-card hover:border-accent/40 transition-all duration-300 h-full flex flex-col shadow-sm hover:shadow-xl">
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-[4/3]">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-card/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-border/50">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-bold text-card-foreground">
                        {destination.rating}
                      </span>
                    </div>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 shadow-lg border-0 backdrop-blur-sm">
                      {destination.price}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 md:p-6 flex flex-col flex-1">
                  {/* Location & Title */}
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <h3 className="text-xl md:text-2xl font-bold text-card-foreground group-hover:text-accent transition-colors duration-200 line-clamp-2">
                      {destination.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
                    {destination.description}
                  </p>

                  {/* Divider */}
                  <div className="w-full h-px bg-border/50 mb-4" />

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-accent/20 text-accent" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {destination.reviews} reviews
                      </span>
                    </div>

                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-200 cursor-pointer group/link"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Explore All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-accent/90 transition-all duration-200 cursor-pointer"
            >
              <span>Explore All Destinations</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PopularDestinations;
