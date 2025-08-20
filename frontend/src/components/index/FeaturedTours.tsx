"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import { tours } from "@/static-data/tours";

const FeaturedTours = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Featured Tour Packages
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked adventures offering exceptional value and unforgettable
            experiences
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tours.map((tour, index) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Card className="overflow-hidden shadow-card-soft hover:shadow-travel transition-all duration-300 border-border/50 h-full">
                <div className="relative overflow-hidden">
                  <Image
                    src={tour.image}
                    alt={tour.title}
                    width={800}
                    height={600}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant={
                        tour.badge === "Best Seller" ? "default" : "secondary"
                      }
                      className="bg-primary text-primary-foreground"
                    >
                      {tour.badge}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="text-xs font-medium text-card-foreground">
                        {tour.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-xl font-bold text-card-foreground mb-3">
                    {tour.title}
                  </h3>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{tour.groupSize}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Highlights:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tour.highlights.map((highlight, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          ${tour.price}
                        </span>
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ${tour.originalPrice}
                        </span>
                      </div>
                    </div>

                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 group">
                      Book Now
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTours;
