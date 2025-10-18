import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Check, Users, Lock, Shield, Key } from "lucide-react";

const identityOptions = [
  {
    id: "poh",
    title: "Proof of Humanity",
    description: "Any verified human on Earth can vote. Democracy at planetary scale. 🌍",
    icon: Users,
    badge: "Recommended",
  },
  {
    id: "community",
    title: "Community Restricted",
    description: "Your crew, your rules. Limit voting to your DAO or address list. 🎯",
    icon: Shield,
    badge: null,
  },
  {
    id: "zk",
    title: "Zero-Knowledge Proof",
    description: "Vote anonymously while proving you're legit. Privacy magic. ✨",
    icon: Lock,
    badge: "Privacy",
  },
  {
    id: "invite",
    title: "Invite-Only",
    description: "VIP access only. Private keys = exclusive voting rights. 🔑",
    icon: Key,
    badge: null,
  },
];

const StepIdentity = () => {
  const [selected, setSelected] = useState<string>("poh");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Who Gets to Vote? 🎭</h2>
        <p className="text-muted-foreground">
          Pick your voters. Everyone? Your squad? Secret agents? You decide.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {identityOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <Card
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`p-6 cursor-pointer smooth-transition relative overflow-hidden ${
                isSelected
                  ? "border-primary bg-primary/5 glow-border"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Badge */}
              {option.badge && (
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">
                    {option.badge}
                  </span>
                </div>
              )}

              {/* Selection indicator */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 smooth-transition ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional info */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Output:</strong> Your selection will generate a voter 
          registry JSON schema with on-chain or off-chain verification parameters.
        </p>
      </div>
    </div>
  );
};

export default StepIdentity;
