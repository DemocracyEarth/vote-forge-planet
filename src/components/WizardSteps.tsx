import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import StepIdentity from "@/components/wizard/StepIdentity";
import StepAuthRestrictions from "@/components/wizard/StepAuthRestrictions";
import StepVotingLogic from "@/components/wizard/StepVotingLogic";
import StepBill from "@/components/wizard/StepBill";
import { z } from "zod";

interface WizardStepsProps {
  onBack: () => void;
}

const WizardSteps = ({ onBack }: WizardStepsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVotingModel, setSelectedVotingModel] = useState<string>("direct");
  const [identityData, setIdentityData] = useState<any>({});
  const [authRestrictions, setAuthRestrictions] = useState<any>({});
  const [votingLogicData, setVotingLogicData] = useState<any>({});
  const [billData, setBillData] = useState<any>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep4Valid, setIsStep4Valid] = useState(false);

  const handleStep2ValidationChange = useCallback((isValid: boolean) => {
    setIsStep2Valid(isValid);
  }, []);

  const handleStep4ValidationChange = useCallback((isValid: boolean) => {
    setIsStep4Valid(isValid);
  }, []);

  const steps = [
    { id: 1, title: t('steps.identity.title'), description: t('steps.identity.description') },
    { id: 2, title: "Access Control", description: "Configure restrictions" },
    { id: 3, title: t('steps.voting.title'), description: t('steps.voting.description') },
    { id: 4, title: t('steps.bill.title'), description: t('steps.bill.description') },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
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

  const handleDeploy = async () => {
    // Proceed with actual deployment directly (tags already generated in Step 4)
    setIsDeploying(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create an election",
          variant: "destructive",
        });
        setIsDeploying(false);
        navigate("/auth");
        return;
      }

      // Client-side validation schema
      const wizardSchema = z.object({
        identityData: z.object({
          authenticationType: z.string().min(1, "Authentication type is required").max(100),
          requireLogin: z.boolean().optional()
        }),
        votingLogicData: z.object({
          model: z.string().min(1, "Voting model is required").max(100),
          aiPrompt: z.string().max(5000, "AI prompt must be less than 5000 characters").optional()
        }),
        billData: z.object({
          title: z.string().min(1, "Title is required").max(500, "Title must be less than 500 characters"),
          description: z.string().max(10000, "Description must be less than 10000 characters").optional(),
          ballotOptions: z.array(z.string().min(1).max(200)).min(2, "At least 2 ballot options required").optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          isOngoing: z.boolean().optional(),
          threshold: z.string().optional(),
          customThreshold: z.string().optional(),
          customOptions: z.record(z.string()).optional()
        })
      }).refine((data) => {
        // If not ongoing and both dates are provided, validate end date is after start date
        if (!data.billData.isOngoing && data.billData.startDate && data.billData.endDate) {
          const start = new Date(data.billData.startDate);
          const end = new Date(data.billData.endDate);
          return end > start;
        }
        return true;
      }, {
        message: "End date must be after start date",
        path: ["billData", "endDate"]
      });

      // Validate input before submission
      const validation = wizardSchema.safeParse({
        identityData,
        votingLogicData,
        billData
      });

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        toast({
          title: "Invalid Input",
          description: firstError.message,
          variant: "destructive",
        });
        setIsDeploying(false);
        return;
      }

      // Format dates to ISO 8601 with timezone
      const formattedBillData = {
        ...billData,
        startDate: billData.startDate && billData.startDate.trim() !== '' 
          ? new Date(billData.startDate).toISOString() 
          : "",
        endDate: billData.endDate && billData.endDate.trim() !== '' 
          ? new Date(billData.endDate).toISOString() 
          : "",
      };

      // Merge quadratic settings from billData into votingLogicConfig
      const votingLogicConfigWithSettings = {
        ...votingLogicData,
        ...(selectedVotingModel === 'quadratic' && billData.quadraticSettings ? {
          quadraticCredits: Number(billData.quadraticSettings.creditsPerVoter) || 100,
          voteCostFormula: billData.quadraticSettings.voteCostFormula || 'quadratic'
        } : {})
      };

      const { data, error } = await supabase.functions.invoke('create-election', {
        body: {
          identityConfig: { ...identityData, restrictions: authRestrictions },
          votingLogicConfig: votingLogicConfigWithSettings,
          billConfig: formattedBillData,
          tags: billData.tags || ['others'],
        }
      });

      if (error) throw error;

      toast({
        title: "Election Created!",
        description: "Your voting page has been generated and is ready to share.",
      });

      // Navigate to the voting page
      navigate(`/vote/${data.electionId}`);
    } catch (error) {
      console.error('Error deploying election:', error);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to create election",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 animate-fade-in-up">
      {/* Progress indicator */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between relative px-2">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border/40 -z-10 rounded-full" />
          
          {/* Progress line */}
          <div 
            className="absolute top-5 left-0 h-0.5 rounded-full -z-10 transition-all duration-500 ease-out bg-primary/80"
            style={{ 
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
            }}
          />

          {steps.map((step) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center relative"
            >
              {/* Step circle */}
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  step.id < currentStep
                    ? "bg-primary/90 border-primary/90 text-primary-foreground shadow-sm"
                    : step.id === currentStep
                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                ) : (
                  <span className="font-semibold text-sm sm:text-base">{step.id}</span>
                )}
              </div>
              
              {/* Step text */}
              <div className="mt-3 text-center max-w-[90px] sm:max-w-[120px]">
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  step.id === currentStep 
                    ? "text-foreground" 
                    : step.id < currentStep
                    ? "text-foreground/70"
                    : "text-muted-foreground"
                }`}>
                  {step.title}
                </p>
                <p className={`text-[10px] sm:text-xs mt-0.5 hidden lg:block ${
                  step.id === currentStep ? "text-muted-foreground/80" : "text-muted-foreground/60"
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 md:p-8 card-glow smooth-transition min-h-[400px] sm:min-h-[500px]">
        {currentStep === 1 && <StepIdentity onDataChange={setIdentityData} />}
        {currentStep === 2 && <StepAuthRestrictions authenticationType={identityData.authenticationType} onDataChange={setAuthRestrictions} onValidationChange={handleStep2ValidationChange} />}
        {currentStep === 3 && <StepVotingLogic selectedModel={selectedVotingModel} onModelChange={setSelectedVotingModel} onDataChange={setVotingLogicData} />}
        {currentStep === 4 && <StepBill votingModel={selectedVotingModel} votingLogicData={votingLogicData} onDataChange={setBillData} onValidationChange={handleStep4ValidationChange} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-2 mt-6 sm:mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="smooth-transition text-xs sm:text-sm"
          size="sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">{currentStep === 1 ? t('wizard.backToHome') : t('wizard.previous')}</span>
          <span className="xs:hidden">{currentStep === 1 ? t('wizard.back') : t('wizard.prev')}</span>
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={handleNext}
            disabled={currentStep === 2 && !isStep2Valid}
            className="bg-primary hover:bg-primary/90 text-primary-foreground smooth-transition text-xs sm:text-sm"
            size="sm"
          >
            <span className="hidden xs:inline">{t('wizard.nextStep')}</span>
            <span className="xs:hidden">{t('wizard.next')}</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || !isStep4Valid}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-border smooth-transition text-xs sm:text-sm"
            size="sm"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                {t('wizard.deploying') || 'Deploying...'}
              </>
            ) : (
              t('wizard.deploy') || 'Deploy to Earth 🌎'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardSteps;
