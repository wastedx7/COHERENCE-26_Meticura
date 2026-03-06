import React from 'react';
import { motion } from 'framer-motion';
import { CTAButton } from '../../../components/common/CTAButton';
import { StatsCard } from '../../../components/common/StatsCard';
import { Landmark, CheckSquare, Search } from 'lucide-react';
import heroSvg from '../../../assets/undraw_printing-invoices_g6c9.svg';

export const Hero = () => {
    return (
        <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-yellow/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] -z-10"></div>

            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_70%,transparent_100%)] -z-10"></div>

            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col gap-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-max">
                            <span className="w-2 h-2 rounded-full bg-primary-yellow animate-ping"></span>
                            <span className="text-sm font-semibold tracking-wider uppercase text-gray-300">Live Budget Surveillance</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-text-white leading-[1.1] tracking-tight">
                            Secure Public Funds <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-yellow to-warning-yellow drop-shadow-[0_0_30px_rgba(255,216,77,0.3)]">In Real-Time</span>
                        </h1>

                        <p className="text-xl text-gray-400 leading-relaxed max-w-xl font-medium">
                            A smart ML platform that watches government spending, automatically catches suspicious patterns, predicts fiscal lapse risks, and suggests budget reallocations before the year ends.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <CTAButton variant="primary" icon className="py-4 px-8 text-lg">
                                View Dashboard
                            </CTAButton>
                            <CTAButton variant="glass" className="py-4 px-8 text-lg hover:border-white/30">
                                Explore Tech Stack
                            </CTAButton>
                        </div>
                    </motion.div>

                    {/* Right Column Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="relative h-full flex items-center justify-center lg:justify-end"
                    >
                        <div className="relative w-full max-w-lg">
                            <div className="absolute inset-0 bg-primary-yellow/20 rounded-full blur-[100px] -z-10 translate-y-10 scale-75"></div>
                            <img src={heroSvg} alt="Financial Tracking" className="w-full h-auto drop-shadow-[0_20px_50px_rgba(255,216,77,0.2)]" />
                        </div>
                    </motion.div>

                </div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
                >
                    <StatsCard
                        value="4 Stages"
                        label="Complete Pipeline"
                        trend="Track • Detect • Predict • Fix"
                        type="neutral"
                    />
                    <StatsCard
                        value="Real-Time"
                        label="Fraud Anomalies"
                        trend="Detected via Isolation Forest"
                        type="warning"
                    />
                    <StatsCard
                        value="Weekly"
                        label="Reallocation Targets"
                        trend="Stop budget from lapsing"
                        type="positive"
                    />
                </motion.div>

            </div>
        </section>
    );
};
