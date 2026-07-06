import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 40 }: LogoProps) {
  // We'll create a highly unique 3D interlocking medical cross / shield hybrid
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Intense glowing orb behind the logo */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-blue-500 blur-xl rounded-full mix-blend-screen" 
      />
      
      {/* The 3D SVG construct */}
      <motion.svg
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        className="relative z-10"
      >
        <defs>
          <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="secondary-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <linearGradient id="highlight-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Central Core - Pulse */}
        <motion.circle 
          cx="50" cy="50" r="12" 
          fill="url(#highlight-grad)" 
          filter="url(#glow)"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Inner Ring - Rotating */}
        <motion.path
          d="M 50 20 A 30 30 0 1 1 49.9 20"
          stroke="url(#primary-grad)"
          strokeWidth="3"
          strokeDasharray="40 20"
          strokeLinecap="round"
          animate={{ rotateZ: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50px 50px" }}
        />

        {/* Outer Hexagon / Shield - Counter-rotating and 3D tilting */}
        <motion.path
          d="M 50 5 L 88.97 27.5 L 88.97 72.5 L 50 95 L 11.03 72.5 L 11.03 27.5 Z"
          stroke="url(#secondary-grad)"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray="80 30"
          strokeLinecap="round"
          animate={{ 
            rotateZ: -360,
            rotateX: [0, 15, 0, -15, 0],
            rotateY: [0, 20, 0, -20, 0]
          }}
          transition={{ 
            rotateZ: { duration: 15, repeat: Infinity, ease: "linear" },
            rotateX: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ transformOrigin: "50px 50px" }}
        />
        
        {/* The Sepsis Cross / Sentinel Watcher element - Floating in 3D */}
        <motion.g
          animate={{
            translateY: [-3, 3, -3],
            rotateY: [0, 10, -10, 0]
          }}
          transition={{
            translateY: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ transformOrigin: "50px 50px" }}
        >
          {/* Vertical Bar */}
          <rect x="44" y="30" width="12" height="40" rx="4" fill="url(#primary-grad)" opacity="0.9" />
          {/* Horizontal Bar */}
          <rect x="30" y="44" width="40" height="12" rx="4" fill="url(#primary-grad)" opacity="0.9" />
          {/* Diamond center overlay */}
          <path d="M 50 43 L 57 50 L 50 57 L 43 50 Z" fill="#ffffff" opacity="0.8" />
        </motion.g>
      </motion.svg>
    </div>
  );
}
