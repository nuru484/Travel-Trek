"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import { destinations } from "@/static-data/destinations";

const PopularDestinations = () => {
  return (
    <section className="py-20 bg-gradient-sky">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Popular Destinations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the world&apos;s most breathtaking locations, carefully
            selected for unforgettable experiences
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <Card className="overflow-hidden shadow-card-soft hover:shadow-travel transition-all duration-300 border-border/50">
                <div className="relative overflow-hidden">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    width={800}
                    height={600}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="text-sm font-medium text-card-foreground">
                        {destination.rating}
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
                      {destination.price}
                    </span>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-xl font-bold text-card-foreground">
                      {destination.name}
                    </h3>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    {destination.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {destination.reviews} reviews
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-primary font-semibold hover:text-primary/80 transition-colors"
                    >
                      Learn More →
                    </motion.button>
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

export default PopularDestinations;
