import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuadraticVotingInterfaceProps {
  options: string[];
  credits: Record<string, number>;
  onCreditsChange: (credits: Record<string, number>) => void;
  totalCredits: number;
  disabled?: boolean;
}

export function QuadraticVotingInterface({
  options,
  credits,
  onCreditsChange,
  totalCredits,
  disabled = false
}: QuadraticVotingInterfaceProps) {
  const { t } = useTranslation();
  
  const calculateCost = (votes: number) => votes * votes;
  
  const totalSpent = Object.values(credits).reduce(
    (sum, votes) => sum + calculateCost(votes), 
    0
  );
  
  const remaining = totalCredits - totalSpent;
  const isOverBudget = remaining < 0;

  return (
    <div className="space-y-6">
      {/* Credit Counter */}
      <div className={`p-4 rounded-lg border-2 transition-all ${
        isOverBudget 
          ? 'bg-destructive/10 border-destructive text-destructive' 
          : 'bg-primary/10 border-primary/30 text-primary'
      }`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold">{t('vote.remainingCredits')}:</span>
          <span className="text-2xl font-bold">{remaining}</span>
        </div>
        <div className="text-xs mt-1 opacity-70">
          Total: {totalCredits} {t('vote.creditsSpent')}
        </div>
      </div>

      {/* Options with Sliders */}
      <div className="space-y-4">
        {options.map((option) => {
          const votes = credits[option] || 0;
          const cost = calculateCost(votes);
          
          return (
            <Card key={option} className="p-4 border-border/50 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-all">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{option}</span>
                  <Badge variant={votes > 0 ? "default" : "outline"}>
                    {votes} {t('vote.votesForOption')}
                  </Badge>
                </div>
                
                {/* Slider */}
                <Slider
                  value={[votes]}
                  onValueChange={([newVotes]) => {
                    onCreditsChange({
                      ...credits,
                      [option]: newVotes
                    });
                  }}
                  max={Math.floor(Math.sqrt(totalCredits))}
                  step={1}
                  disabled={disabled}
                  className="w-full"
                />
                
                {/* Cost Display */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('vote.creditsCost')}: {cost} {t('vote.creditsSpent')}</span>
                  <span>({votes}² = {cost})</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Explainer */}
      <Alert className="bg-accent/10 border-accent/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {t('vote.quadraticExplainer')}
        </AlertDescription>
      </Alert>

      {isOverBudget && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            ⚠️ {t('vote.creditsExceeded')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
