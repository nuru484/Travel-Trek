"use client";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { footerLinks, socialLinks, contactInfo } from "@/static-data/footer";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-card border-t border-border">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-transparent pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="lg:col-span-4"
            >
              <div className="mb-6">
                <h3 className="text-2xl lg:text-3xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Travel Trek
                </h3>
                <p className="text-muted-foreground text-sm lg:text-base leading-relaxed max-w-sm">
                  Creating extraordinary travel experiences that inspire,
                  educate, and connect people with the world&apos;s most
                  beautiful destinations.
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                {contactInfo.map((contact, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <contact.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {contact.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Footer Links */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                {Object.entries(footerLinks).map(([category, links], index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                      {category}
                    </h4>
                    <ul className="space-y-3">
                      {links.map((link) => (
                        <li key={link}>
                          <a
                            href="#"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-block hover:translate-x-0.5"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Bottom Bar */}
        <div className="py-6 lg:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
            >
              <p className="text-sm text-muted-foreground">
                © {currentYear} Travel Trek. All rights reserved.
              </p>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
                <span>•</span>
                <a href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              {socialLinks.map((social, index) => (
                <motion.a
                  key={`${social.label}-${index}`}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-muted/60 hover:bg-primary/10 border border-border/50 hover:border-primary/30 flex items-center justify-center transition-all duration-200 group"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
