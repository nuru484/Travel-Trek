"use client";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { footerLinks, socialLinks, contactInfo } from "@/static-data/footer";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <h3 className="text-2xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
              TravelAdventure
            </h3>
            <p className="text-background/80 mb-6 leading-relaxed">
              Creating extraordinary travel experiences that inspire, educate,
              and connect people with the world&apos;s most beautiful
              destinations.
            </p>

            <div className="space-y-3">
              {contactInfo.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 text-sm text-background/80"
                >
                  <contact.icon className="h-4 w-4" />
                  <span>{contact.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold mb-4 text-background">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-background/80 hover:text-primary-glow transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <Separator className="bg-background/20 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-background/80 text-sm mb-4 md:mb-0"
          >
            © 2024 TravelAdventure. All rights reserved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex space-x-4"
          >
            {socialLinks.map((social, index) => (
              <motion.a
                key={(social.label, index)}
                href={social.href}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5 text-background/80" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
