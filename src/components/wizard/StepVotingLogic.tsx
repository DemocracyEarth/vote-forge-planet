import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Vote, Users2, Scale, Network, Star } from "lucide-react";

const votingModels = [
  {
    id: "direct",
    icon: Vote,
  },
  {
    id: "liquid",
    icon: Network,
  },
  {
    id: "quadratic",
    icon: Scale,
  },
  {
    id: "weighted",
    icon: Star,
  },
];

interface StepVotingLogicProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onDataChange?: (data: any) => void;
}

const StepVotingLogic = ({ selectedModel, onModelChange, onDataChange }: StepVotingLogicProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        model: selectedModel,
      });
    }
  }, [selectedModel, onDataChange]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">{t('steps.voting.heading')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('steps.voting.subtitle')}
        </p>
      </div>

      {/* Template selection */}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {votingModels.map((model) => {
          const Icon = model.icon;
          const isSelected = selectedModel === model.id;

          return (
            <Card
              key={model.id}
              onClick={() => onModelChange(model.id)}
              className={`p-4 sm:p-6 cursor-pointer smooth-transition ${
                isSelected
                  ? "border-primary bg-primary/5 glow-border"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1">
                    {t(`steps.voting.models.${model.id}.title`)}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t(`steps.voting.models.${model.id}.description`)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Output preview */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{t('steps.voting.output')}</strong> {t('steps.voting.outputDesc')}
        </p>
      </div>
    </div>
  );
};

export default StepVotingLogic;
