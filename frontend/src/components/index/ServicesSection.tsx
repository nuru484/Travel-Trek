"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { services } from "@/static-data/services";

const ServicesSection = () => {
  return (
    <section
      id="services"
      className="py-24 md:py-32 bg-background relative overflow-hidden"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
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
              <Sparkles className="h-3 w-3 mr-1" />
              Our Commitment
            </Badge>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Why Choose Our Tours?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We&apos;re committed to providing exceptional travel experiences
            with unmatched service and attention to detail
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
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
              <Card className="relative text-center h-full border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="p-6 md:p-8 relative z-10 flex flex-col items-center h-full">
                  {/* Icon Container */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                    }}
                    className="relative mb-6"
                  >
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Icon Background */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-shadow duration-300">
                      <service.icon className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />

                      {/* Decorative Corner */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg md:text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors duration-200">
                      {service.title}
                    </h3>

                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Hover Indicator */}
                  <motion.div
                    className="mt-6 w-8 h-1 bg-primary/20 rounded-full group-hover:w-full group-hover:bg-primary transition-all duration-300"
                    initial={{ width: "2rem" }}
                  />
                </CardContent>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 md:mt-20"
        >
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-8 md:p-12 border border-border/50">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-bold text-primary"
                >
                  500+
                </motion.div>
                <p className="text-sm md:text-base font-semibold text-foreground">
                  Tours Completed
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Successful adventures worldwide
                </p>
              </div>

              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-bold text-accent"
                >
                  98%
                </motion.div>
                <p className="text-sm md:text-base font-semibold text-foreground">
                  Satisfaction Rate
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Happy customers guaranteed
                </p>
              </div>

              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-bold text-primary"
                >
                  24/7
                </motion.div>
                <p className="text-sm md:text-base font-semibold text-foreground">
                  Support Available
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Always here to help you
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;
