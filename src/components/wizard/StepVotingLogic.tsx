import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Vote, Users2, Scale, Network, Star, Sparkles } from "lucide-react";

const votingModels = [
  {
    id: "direct",
    title: "Direct Democracy",
    description: "One person, one vote. Simple majority wins.",
    icon: Vote,
  },
  {
    id: "liquid",
    title: "Liquid Voting",
    description: "Delegate your vote to trusted representatives.",
    icon: Network,
  },
  {
    id: "quadratic",
    title: "Quadratic Voting",
    description: "Allocate voting power with diminishing returns.",
    icon: Scale,
  },
  {
    id: "weighted",
    title: "Reputation-Based",
    description: "Votes weighted by reputation or contribution.",
    icon: Star,
  },
];

const StepVotingLogic = () => {
  const [selectedModel, setSelectedModel] = useState<string>("direct");
  const [aiPrompt, setAiPrompt] = useState("");
  const [useAI, setUseAI] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Configure Voting Logic</h2>
        <p className="text-muted-foreground">
          Define the rules of your vote using templates or AI-powered prompts.
        </p>
      </div>

      {/* Toggle between templates and AI */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={!useAI ? "default" : "ghost"}
          size="sm"
          onClick={() => setUseAI(false)}
          className="smooth-transition"
        >
          Templates
        </Button>
        <Button
          variant={useAI ? "default" : "ghost"}
          size="sm"
          onClick={() => setUseAI(true)}
          className="smooth-transition"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Prompt
        </Button>
      </div>

      {!useAI ? (
        <>
          {/* Template selection */}
          <div className="grid md:grid-cols-2 gap-4">
            {votingModels.map((model) => {
              const Icon = model.icon;
              const isSelected = selectedModel === model.id;

              return (
                <Card
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-6 cursor-pointer smooth-transition ${
                    isSelected
                      ? "border-primary bg-primary/5 glow-border"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Icon className={`w-6 h-6 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{model.title}</h3>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
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
                Describe your voting system in natural language
              </label>
              <Textarea
                placeholder="Example: Create a quadratic voting system where verified citizens can allocate up to 100 points per issue, redistributing their voting power logarithmically. Votes are transparent but pseudonymous."
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
              Generate Voting Logic
            </Button>

            {/* Example prompts */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Example prompts:</p>
              <div className="space-y-2">
                {[
                  "Quadratic voting with 100 points per voter",
                  "Delegative democracy with liquid vote transfers",
                  "Reputation-weighted voting based on contribution history",
                ].map((example, i) => (
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
          <strong className="text-foreground">Output:</strong> Smart contract ABI or JSON logic 
          definition will be generated based on your selection.
        </p>
      </div>
    </div>
  );
};

export default StepVotingLogic;
