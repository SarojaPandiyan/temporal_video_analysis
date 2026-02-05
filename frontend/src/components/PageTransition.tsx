// components/PageTransition.tsx
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <motion.div
    key={location.pathname}
    initial={{
        opacity: 0,
        rotateX: -10,
        scale: 0.95,
        filter: "blur(12px)",
    }}
    animate={{
        opacity: 1,
        rotateX: 0,
        scale: 1,
        filter: "blur(0px)",
    }}
    exit={{
        opacity: 0,
        rotateX: 10,
        scale: 1.05,
        filter: "blur(12px)",
    }}
    transition={{
        duration: 2,
        ease: [0.19, 1, 0.22, 1], 
    }}
    style={{ transformPerspective: 1200 }}
    className="w-full min-h-screen"
    >
    {children}
    </motion.div>

  );
}
