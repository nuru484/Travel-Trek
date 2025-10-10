"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, CheckCircle2, Gift, Globe, Bell } from "lucide-react";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubscribed(true);
    setIsSubmitting(false);

    // Reset after 5 seconds
    setTimeout(() => {
      setIsSubscribed(false);
      setEmail("");
    }, 5000);
  };

  const benefits = [
    {
      icon: Gift,
      title: "Exclusive Deals",
      description: "Early access to limited offers",
    },
    {
      icon: Globe,
      title: "New Destinations",
      description: "Be first to explore new tours",
    },
    {
      icon: Bell,
      title: "Travel Tips",
      description: "Expert advice & insider secrets",
    },
  ];

  return (
    <section
      id="newsletter"
      className="py-24 md:py-32 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <Card className="shadow-xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12 lg:p-16">
              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center mb-6 md:mb-8"
              >
                <Badge
                  variant="outline"
                  className="mb-4 border-primary/20 text-primary bg-primary/5"
                >
                  Join 10,000+ Travelers
                </Badge>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-card-foreground mb-4 tracking-tight">
                  Stay Updated on Amazing Deals
                </h2>

                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Subscribe to our newsletter and be the first to know about
                  exclusive travel deals, new destinations, and insider tips
                  from our travel experts.
                </p>
              </motion.div>

              {/* Benefits Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="grid sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-base text-card-foreground mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                onSubmit={handleSubmit}
                className="max-w-xl mx-auto"
              >
                {!isSubscribed ? (
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                        className="h-12 md:h-14 pl-12 pr-4 text-base border-border/50 focus:border-primary bg-background"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 md:h-14 px-6 md:px-8 font-semibold shadow-md hover:shadow-lg transition-all duration-200 group whitespace-nowrap"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="mr-2"
                          >
                            <Send className="h-4 w-4 md:h-5 md:w-5" />
                          </motion.div>
                          <span>Subscribing...</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <Send className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-card-foreground mb-2">
                        Successfully Subscribed! 🎉
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Check your email for a welcome message
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.form>

              {/* Footer Text */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                viewport={{ once: true }}
                className="text-center mt-6"
              >
                <p className="text-xs md:text-sm text-muted-foreground">
                  🔒 We respect your privacy • 📧 Unsubscribe anytime • ✨ No
                  spam, ever
                </p>
              </motion.div>

              {/* Decorative Line */}
              <div className="mt-8 flex items-center gap-4 max-w-md mx-auto">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-xs font-medium text-muted-foreground px-3">
                  Trusted by travelers worldwide
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
