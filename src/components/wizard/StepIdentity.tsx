import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Check, Users, Lock, Shield, Key } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StepIdentityProps {
  onDataChange?: (data: any) => void;
}

const StepIdentity = ({ onDataChange }: StepIdentityProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("email");

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        authenticationType: selected,
        requireLogin: true,
      });
    }
  }, [selected, onDataChange]);

  const identityOptionsTranslated = [
    {
      id: "email",
      title: t('steps.identity.email'),
      description: t('steps.identity.emailDesc'),
      icon: Shield,
      badge: t('steps.identity.recommended'),
      disabled: false,
    },
    {
      id: "phone",
      title: t('steps.identity.phone'),
      description: t('steps.identity.phoneDesc'),
      icon: Lock,
      badge: "Under Development",
      disabled: true,
    },
    {
      id: "google",
      title: t('steps.identity.google'),
      description: t('steps.identity.googleDesc'),
      icon: Users,
      badge: null,
      disabled: false,
    },
    {
      id: "worldid",
      title: t('steps.identity.worldId'),
      description: t('steps.identity.worldIdDesc'),
      icon: Key,
      badge: "Under Development",
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">{t('steps.identity.heading')}</h2>
        <p className="text-muted-foreground">
          {t('steps.identity.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {identityOptionsTranslated.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          const isDisabled = option.disabled;

          return (
            <Card
              key={option.id}
              onClick={() => !isDisabled && setSelected(option.id)}
              className={`p-6 smooth-transition relative overflow-hidden ${
                isDisabled 
                  ? "opacity-60 cursor-not-allowed border-border/50" 
                  : isSelected
                    ? "border-primary bg-primary/5 glow-border cursor-pointer"
                    : "border-border hover:border-primary/50 cursor-pointer"
              }`}
            >
              {/* Badge */}
              {option.badge && (
                <div className="absolute top-4 right-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    isDisabled 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-primary/20 text-primary"
                  }`}>
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
          <strong className="text-foreground">{t('steps.identity.output')}</strong> {t('steps.identity.outputDesc')}
        </p>
      </div>
    </div>
  );
};

export default StepIdentity;
