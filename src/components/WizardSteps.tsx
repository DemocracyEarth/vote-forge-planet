import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import StepIdentity from "@/components/wizard/StepIdentity";
import StepVotingLogic from "@/components/wizard/StepVotingLogic";
import StepBill from "@/components/wizard/StepBill";

interface WizardStepsProps {
  onBack: () => void;
}

const WizardSteps = ({ onBack }: WizardStepsProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: t('steps.identity.title'), description: t('steps.identity.description') },
    { id: 2, title: t('steps.voting.title'), description: t('steps.voting.description') },
    { id: 3, title: t('steps.bill.title'), description: t('steps.bill.description') },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in-up">
      {/* Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.id < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : step.id === currentStep
                    ? "bg-primary border-primary text-primary-foreground glow-border"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-3 text-center">
                <p className={`text-sm font-medium ${step.id === currentStep ? "text-primary" : "text-muted-foreground"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-8 card-glow smooth-transition min-h-[500px]">
        {currentStep === 1 && <StepIdentity />}
        {currentStep === 2 && <StepVotingLogic />}
        {currentStep === 3 && <StepBill />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="smooth-transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? t('wizard.backToHome') : t('wizard.previous')}
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-primary-foreground smooth-transition"
          >
            {t('wizard.nextStep')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => alert(t('wizard.deploySuccess'))}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-border smooth-transition"
          >
            {t('wizard.deploy')}
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardSteps;
