import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Vote, Users2, Scale, Network, Star, Sparkles } from "lucide-react";

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
}

const StepVotingLogic = ({ selectedModel, onModelChange }: StepVotingLogicProps) => {
  const { t } = useTranslation();
  const [aiPrompt, setAiPrompt] = useState("");
  const [useAI, setUseAI] = useState(false);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    const promptText = t(`steps.voting.models.${modelId}.prompt`);
    setAiPrompt(promptText);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">{t('steps.voting.heading')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('steps.voting.subtitle')}
        </p>
      </div>

      {/* Toggle between templates and AI */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-full sm:w-fit">
        <Button
          variant={!useAI ? "default" : "ghost"}
          size="sm"
          onClick={() => setUseAI(false)}
          className="smooth-transition"
        >
          {t('steps.voting.templates')}
        </Button>
        <Button
          variant={useAI ? "default" : "ghost"}
          size="sm"
          onClick={() => setUseAI(true)}
          className="smooth-transition"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {t('steps.voting.aiPrompt')}
        </Button>
      </div>

      {!useAI ? (
        <>
          {/* Template selection */}
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {votingModels.map((model) => {
              const Icon = model.icon;
              const isSelected = selectedModel === model.id;

              return (
                <Card
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)}
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
        </>
      ) : (
        <>
          {/* AI Prompt interface */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('steps.voting.aiPromptLabel')}
              </label>
              <Textarea
                placeholder={t('steps.voting.aiPromptPlaceholder')}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-border"
              disabled={!aiPrompt.trim()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t('steps.voting.generateButton')}
            </Button>

            {/* Example prompts */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('steps.voting.examplePrompts')}</p>
              <div className="space-y-2">
                {(t('steps.voting.exampleList', { returnObjects: true }) as string[]).map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setAiPrompt(example)}
                    className="text-xs text-primary hover:underline block"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
