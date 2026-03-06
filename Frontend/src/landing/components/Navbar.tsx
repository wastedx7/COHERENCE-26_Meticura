import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Eye, Github, LogIn } from 'lucide-react';
import { CTAButton } from './CTAButton';

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Problem', href: '#problem' },
        { label: 'Engine', href: '#ai-detection' },
        { label: 'Pipeline', href: '#architecture' },
        { label: 'Dashboard', href: '#dashboard' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/60 backdrop-blur-xl border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-6'
                }`}
        >
            <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
                {/* Logo */}
                <a href="#" className="flex items-center gap-3 relative group">
                    <div className="p-2 bg-primary-yellow/20 rounded-xl group-hover:bg-primary-yellow/30 transition-colors">
                        <Eye className="w-6 h-6 text-primary-yellow" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white hidden sm:block">Budget Watchdog</span>
                </a>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-8">
                    <div className="flex items-center gap-6 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-gray-300 hover:text-primary-yellow transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-4">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <Github className="w-5 h-5" />
                    </a>
                    <CTAButton variant="glass" className="py-2.5 px-5 text-sm uppercase tracking-wider flex items-center gap-2">
                        <LogIn className="w-4 h-4" />                  </CTAButton>
                    <CTAButton variant="primary" className="py-2.5 px-5 text-sm uppercase tracking-wider">
                        Live Demo
                    </CTAButton>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden text-gray-300 hover:text-white p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
                    >
                        <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-lg font-medium text-gray-300 hover:text-primary-yellow"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <hr className="border-white/10" />
                            <div className="flex flex-col gap-4">
                                <CTAButton variant="glass" className="w-full justify-center">Login</CTAButton>
                                <CTAButton variant="primary" className="w-full justify-center">Live Demo</CTAButton>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};
