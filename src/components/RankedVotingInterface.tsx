import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RankedVotingInterfaceProps {
  options: string[];
  rankedChoices: string[];
  onRankChange: (ranked: string[]) => void;
  disabled?: boolean;
}

export const RankedVotingInterface = ({
  options,
  rankedChoices,
  onRankChange,
  disabled = false,
}: RankedVotingInterfaceProps) => {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Get unranked options
  const unrankedOptions = options.filter((opt) => !rankedChoices.includes(opt));

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRanked = [...rankedChoices];
    const draggedItem = newRanked[draggedIndex];
    newRanked.splice(draggedIndex, 1);
    newRanked.splice(index, 0, draggedItem);
    onRankChange(newRanked);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const addToRanked = (option: string) => {
    onRankChange([...rankedChoices, option]);
  };

  const removeFromRanked = (option: string) => {
    onRankChange(rankedChoices.filter((opt) => opt !== option));
  };

  const getRankLabel = (index: number) => {
    const labels = ["1st", "2nd", "3rd"];
    if (index < 3) return labels[index];
    return `${index + 1}th`;
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm font-medium">
          {t('vote.rankYourChoices')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('vote.dragToReorder')}
        </p>
      </div>

      {/* Ranked Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Rankings
        </h3>
        
        {rankedChoices.length === 0 ? (
          <Card className="p-6 text-center border-dashed border-2 border-border/50">
            <p className="text-sm text-muted-foreground">
              Click options below to add them to your ranking
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rankedChoices.map((option, index) => (
              <Card
                key={option}
                draggable={!disabled}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-4 cursor-move transition-all ${
                  draggedIndex === index ? "opacity-50" : ""
                } ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50"}`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {getRankLabel(index)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Choice
                    </span>
                  </div>

                  <span className="flex-1 font-medium">{option}</span>

                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromRanked(option)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Unranked Options */}
      {unrankedOptions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('vote.notRanked')}
          </h3>
          <div className="space-y-2">
            {unrankedOptions.map((option) => (
              <Card
                key={option}
                className={`p-4 transition-all ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-primary/50 cursor-pointer"
                }`}
                onClick={() => !disabled && addToRanked(option)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 font-medium text-muted-foreground">
                    {option}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
