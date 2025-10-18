import { useState } from "react";
import Hero from "@/components/Hero";
import WizardSteps from "@/components/WizardSteps";
import Footer from "@/components/Footer";

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="min-h-screen aurora-bg">
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
