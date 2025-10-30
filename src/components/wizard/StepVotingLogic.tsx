import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Vote, Scale, ListOrdered, Coins } from "lucide-react";

const votingModels = [
  {
    id: "direct",
    icon: Vote,
  },
  {
    id: "quadratic",
    icon: Scale,
  },
  {
    id: "ranked",
    icon: ListOrdered,
  },
  {
    id: "token",
    icon: Coins,
  },
];

interface StepVotingLogicProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onDataChange?: (data: any) => void;
}

const StepVotingLogic = ({ selectedModel, onModelChange, onDataChange }: StepVotingLogicProps) => {
  const { t } = useTranslation();
  const [allowLiquidDelegation, setAllowLiquidDelegation] = useState(false);
  const [quadraticCredits, setQuadraticCredits] = useState(100);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        model: selectedModel,
        allowLiquidDelegation,
        quadraticCredits: selectedModel === 'quadratic' ? quadraticCredits : undefined,
      });
    }
  }, [selectedModel, allowLiquidDelegation, quadraticCredits, onDataChange]);

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

      {/* Quadratic Credits Input (only for quadratic voting) */}
      {selectedModel === 'quadratic' && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 backdrop-blur-sm">
          <Label htmlFor="quadratic-credits" className="text-base font-semibold">
            {t('steps.voting.quadraticCredits.title')}
          </Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            {t('steps.voting.quadraticCredits.description')}
          </p>
          <Input
            id="quadratic-credits"
            type="number"
            min={1}
            max={1000}
            value={quadraticCredits}
            onChange={(e) => setQuadraticCredits(Number(e.target.value))}
            className="max-w-xs"
          />
        </div>
      )}

      {/* Liquid Delegation Toggle */}
      <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="liquid-delegation" className="text-base font-semibold cursor-pointer">
              {t('steps.voting.liquidDelegation.title')}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('steps.voting.liquidDelegation.description')}
            </p>
          </div>
          <Switch
            id="liquid-delegation"
            checked={allowLiquidDelegation}
            onCheckedChange={setAllowLiquidDelegation}
          />
        </div>
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
