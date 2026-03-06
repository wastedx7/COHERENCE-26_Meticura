import React from 'react';
import { Eye, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-black border-t border-white/10 pt-24 pb-12 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary-yellow/5 sm:bg-primary-yellow/10 rounded-full blur-[120px] -z-10"></div>

            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <a href="#" className="flex items-center gap-3">
                            <div className="p-2 bg-primary-yellow/20 rounded-xl">
                                <Eye className="w-6 h-6 text-primary-yellow" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white">Budget Watchdog</span>
                        </a>
                        <p className="text-gray-400 leading-relaxed max-w-sm">
                            Real-time ML platform tracking money flow, detecting anomalous spending, predicting lapse risk, and suggesting reallocations for government departments.
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="text-white font-semibold mb-2 uppercase tracking-wider text-sm">Features</h4>
                        <a href="#problem" className="text-gray-400 hover:text-primary-yellow text-sm">Anomaly Detection</a>
                        <a href="#dashboard" className="text-gray-400 hover:text-primary-yellow text-sm">Lapse Predictor</a>
                        <a href="#impact" className="text-gray-400 hover:text-primary-yellow text-sm">Reallocation Engine</a>
                        <a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">Command Center</a>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="text-white font-semibold mb-2 uppercase tracking-wider text-sm">Technology</h4>
                        <a href="#architecture" className="text-gray-400 hover:text-primary-yellow text-sm">React + FastAPI</a>
                        <a href="#ai-detection" className="text-gray-400 hover:text-primary-yellow text-sm">Isolation Forest</a>
                        <a href="#scalability" className="text-gray-400 hover:text-primary-yellow text-sm">Celery Workers</a>
                        <a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">PostgreSQL DB</a>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="text-white font-semibold mb-2 uppercase tracking-wider text-sm">Company</h4>
                        <a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">About</a>
                        <a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">Documentation</a>
                        <a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">Methodology</a>
                        <a href="#" className="text-gray-400 hover:text-primary-yellow text-sm">Contact</a>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Budget Watchdog Platform. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm text-gray-500 hover:text-white">Privacy Policy</a>
                        <a href="#" className="text-sm text-gray-500 hover:text-white">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
