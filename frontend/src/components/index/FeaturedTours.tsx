"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link"; // ✅ Added
import { tours } from "@/static-data/tours";

const FeaturedTours = () => {
  return (
    <section id="tours" className="py-24 md:py-32 bg-background">
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
              className="mb-4 border-primary/20 text-primary bg-primary/5"
            >
              Curated Experiences
            </Badge>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Featured Tour Packages
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Handpicked adventures offering exceptional value and unforgettable
            experiences across breathtaking destinations
          </p>
        </motion.div>

        {/* Tours Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {tours.map((tour, index) => (
            <motion.div
              key={tour.id}
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
              <Card className="overflow-hidden border border-border bg-card hover:border-primary/30 transition-all duration-300 h-full flex flex-col shadow-sm hover:shadow-lg">
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-[4/3]">
                  <Image
                    src={tour.image}
                    alt={tour.title}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant={
                        tour.badge === "Best Seller" ? "default" : "secondary"
                      }
                      className="bg-primary text-primary-foreground shadow-md backdrop-blur-sm border-0 font-medium"
                    >
                      {tour.badge}
                    </Badge>
                  </div>

                  {/* Rating */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-card/95 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm border border-border/50">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <span className="text-xs font-semibold text-card-foreground">
                        {tour.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 md:p-6 flex flex-col flex-1">
                  {/* Title */}
                  <h3 className="text-lg md:text-xl font-bold text-card-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {tour.title}
                  </h3>

                  {/* Meta Information */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-accent" />
                      <span className="font-medium">{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="font-medium">{tour.groupSize}</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-5 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Highlights
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tour.highlights.slice(0, 3).map((highlight, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          {highlight}
                        </Badge>
                      ))}
                      {tour.highlights.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-border/60 bg-muted/30 text-muted-foreground"
                        >
                          +{tour.highlights.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-border/50 mb-5" />

                  {/* Price and CTA */}
                  <div className="mt-auto space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-bold text-primary">
                        ${tour.price}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ${tour.originalPrice}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded">
                        Save ${tour.originalPrice - tour.price}
                      </span>
                    </div>

                    {/* ✅ Wrapped with Next Link and added cursor-pointer */}
                    <Link href="/login" passHref>
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm hover:shadow-md transition-all duration-200 group/button cursor-pointer"
                        size="lg"
                      >
                        <span>Book Now</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/button:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <Button
            variant="outline"
            size="lg"
            className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 font-semibold cursor-pointer"
          >
            View All Tours
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedTours;
