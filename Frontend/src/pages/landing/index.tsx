import React, { Suspense, lazy } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

// Lazy loading sections to optimize performance
const Hero = lazy(() => import('./components/Hero').then(module => ({ default: module.Hero })));
const Problem = lazy(() => import('./components/Problem').then(module => ({ default: module.Problem })));
const Solution = lazy(() => import('./components/Solution').then(module => ({ default: module.Solution })));
const Innovation = lazy(() => import('./components/Innovation').then(module => ({ default: module.Innovation })));
const Architecture = lazy(() => import('./components/Architecture').then(module => ({ default: module.Architecture })));
const AIDetection = lazy(() => import('./components/AIDetection').then(module => ({ default: module.AIDetection })));
const Scalability = lazy(() => import('./components/Scalability').then(module => ({ default: module.Scalability })));
const DashboardPreview = lazy(() => import('./components/DashboardPreview').then(module => ({ default: module.DashboardPreview })));
const Impact = lazy(() => import('./components/Impact').then(module => ({ default: module.Impact })));
const BusinessModel = lazy(() => import('./components/BusinessModel').then(module => ({ default: module.BusinessModel })));
const Research = lazy(() => import('./components/Research').then(module => ({ default: module.Research })));
const CTA = lazy(() => import('./components/CTA').then(module => ({ default: module.CTA })));

// Loading fallback
const LoadingFallback = () => (
    <div className="w-full h-32 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-primary-yellow animate-spin"></div>
    </div>
);

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-primary-black text-text-white font-sans selection:bg-primary-yellow/30 relative">
            <Navbar />

            <main className="overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                    <Hero />
                    <Problem />
                    <Solution />
                    <Innovation />
                    <Architecture />
                    <AIDetection />
                    <Scalability />
                    <DashboardPreview />
                    <Impact />
                    <BusinessModel />
                    <Research />
                    <CTA />
                </Suspense>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
