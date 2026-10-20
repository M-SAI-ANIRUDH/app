import { motion } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];

export const MaskedLine = ({ children, delay = 0, className = "" }) => (
  <span className={`block overflow-hidden pb-1 ${className}`}>
    <motion.span
      className="block"
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export const FadeUp = ({ children, delay = 0, className = "", once = true }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export const FlowerMark = ({ className = "h-7 w-7" }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <g fill="#B8745B">
      <circle cx="32" cy="19" r="8" />
      <circle cx="43.4" cy="27.3" r="8" />
      <circle cx="39" cy="40.7" r="8" />
      <circle cx="25" cy="40.7" r="8" />
      <circle cx="20.6" cy="27.3" r="8" />
    </g>
    <circle cx="32" cy="31" r="5.5" fill="#E8CFC5" />
  </svg>
);
