import React from 'react';
import { Navbar } from './components/landing/Navbar';
import { Hero } from './components/landing/Hero';
import { Problem } from './components/landing/Problem';
import { HowItWorks } from './components/landing/HowItWorks';
import Benefits from './components/landing/Benefits';
import TrialForm from './components/landing/TrialForm';
import FAQ from './components/landing/FAQ';
import Footer from './components/landing/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Benefits />
        <TrialForm />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;