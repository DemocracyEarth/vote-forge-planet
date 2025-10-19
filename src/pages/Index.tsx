import { useState } from "react";
import Hero from "@/components/Hero";
import WizardSteps from "@/components/WizardSteps";
import Footer from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LLMSettings } from "@/components/LLMSettings";

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="min-h-screen aurora-bg">
      {/* LLM Settings in top left */}
      <LLMSettings />
      
      {/* Controls positioned top right */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {!showWizard ? (
        <Hero onStartWizard={() => setShowWizard(true)} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <WizardSteps onBack={() => setShowWizard(false)} />
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Index;
