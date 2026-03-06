import React from 'react';
import { motion } from 'framer-motion';
import { CTAButton } from './CTAButton';

export const CTA = () => {
    return (
        <section id="cta" className="py-32 relative text-center flex flex-col items-center justify-center">
            {/* Background Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary-yellow/20 rounded-full blur-[150px] -z-10"></div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-yellow/10 border border-primary-yellow/30 text-primary-yellow text-sm font-semibold tracking-widest uppercase mb-8">
                        Deploy Instantly
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-8">
                        Stop Funds From <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-yellow to-warning-yellow">Lapsing & Leaking</span>
                    </h2>
                    <p className="text-xl text-gray-400 font-medium mb-12 max-w-2xl mx-auto">
                        Integrate the Budget Watchdog platform to proactively analyze, detect, predict, and optimize. Secure tax-payer money today.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <CTAButton variant="primary" icon className="py-4 px-10 text-lg">
                            Launch Command Center
                        </CTAButton>
                        <CTAButton variant="glass" className="py-4 px-10 text-lg group">
                            Review FlowGuard Data
                        </CTAButton>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
