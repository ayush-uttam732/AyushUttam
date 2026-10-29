import { SOCIAL } from "../utils/constants";

// Edit these. WhatsApp number = country code + number, digits only (India: 91XXXXXXXXXX).
export const contact = {
  name: "Ayush Uttam",
  role: "Creative Developer",
  whatsapp: "918429201207", // <- put YOUR WhatsApp number here
  phoneDisplay: "+91 8429201207",
  email: SOCIAL.email,
  location: "India",
  github: SOCIAL.github,
  linkedin: SOCIAL.linkedin,
  greeting: "Hey! 👋 I'm Ayush. What would you like to build together?",
  quickReplies: ["Project inquiry", "I want to hire you", "Just saying hi 👋"],
  /** Every message starts with this line, so you know it came from the portfolio. */
  prefix: "Hi Ayush! (via your portfolio) ",
  status: [
    "PHONE POWERING ON",
    "CONTACT CARD LOADED",
    "WHATSAPP READY — SEND A MESSAGE",
  ],
};

export const whatsappLink = (message: string) =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(contact.prefix + message)}`;