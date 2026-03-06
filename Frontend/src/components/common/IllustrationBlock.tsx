import React from 'react';
import { motion } from 'framer-motion';

interface IllustrationBlockProps {
    src: string;
    alt: string;
    className?: string;
    animated?: boolean;
}

export const IllustrationBlock: React.FC<IllustrationBlockProps> = ({
    src,
    alt,
    className = '',
    animated = true
}) => {
    // Using Framer Motion to give a floating effect to illustrations
    if (animated) {
        return (
            <motion.div
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={`relative z-10 w-full h-full flex items-center justify-center ${className}`}
            >
                <div className="absolute inset-0 bg-primary-yellow/20 rounded-full blur-[100px] -z-10 translate-y-10 scale-75"></div>
                <img src={src} alt={alt} className="w-full max-w-md h-auto drop-shadow-2xl" />
            </motion.div>
        );
    }

    return (
        <div className={`relative z-10 w-full h-full flex items-center justify-center ${className}`}>
            <div className="absolute inset-0 bg-primary-yellow/20 rounded-full blur-[100px] -z-10 translate-y-10 scale-75"></div>
            <img src={src} alt={alt} className="w-full max-w-md h-auto drop-shadow-2xl" />
        </div>
    );
};
