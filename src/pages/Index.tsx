import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Hero from "@/components/Hero";
import WizardSteps from "@/components/WizardSteps";
import Footer from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import FeedbackButton from "@/components/FeedbackButton";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWizard, setShowWizard] = useState(searchParams.get("wizard") === "true");

  useEffect(() => {
    if (searchParams.get("wizard") === "true") {
      setShowWizard(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen aurora-bg">
      {/* Controls positioned top right */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
        <FeedbackButton />
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {!showWizard ? (
        <Hero onStartWizard={() => {
          setShowWizard(true);
          setSearchParams({ wizard: "true" });
        }} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <WizardSteps onBack={() => {
            setShowWizard(false);
            setSearchParams({});
          }} />
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Index;
