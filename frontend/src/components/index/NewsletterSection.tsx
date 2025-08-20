"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Send } from "lucide-react";

const NewsletterSection = () => {
  return (
    <section className="py-20 bg-gradient-ocean">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="shadow-travel border-border/50 overflow-hidden">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="w-20 h-20 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <Mail className="h-10 w-10 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-card-foreground mb-4"
              >
                Stay Updated on Amazing Deals
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
              >
                Subscribe to our newsletter and be the first to know about
                exclusive travel deals, new destinations, and insider tips from
                our travel experts.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 h-12 text-center sm:text-left"
                />
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 group"
                >
                  Subscribe
                  <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="text-sm text-muted-foreground mt-4"
              >
                ✨ Get exclusive discounts • 🌍 Discover new destinations • 📧
                Unsubscribe anytime
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;
