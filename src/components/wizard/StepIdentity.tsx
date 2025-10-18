import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Check, Users, Lock, Shield, Key } from "lucide-react";
import { useTranslation } from "react-i18next";

const StepIdentity = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>("poh");

  const identityOptionsTranslated = [
    {
      id: "poh",
      title: t('steps.identity.worldId'),
      description: t('steps.identity.worldIdDesc'),
      icon: Users,
      badge: t('steps.identity.recommended'),
    },
    {
      id: "community",
      title: t('steps.identity.community'),
      description: t('steps.identity.communityDesc'),
      icon: Shield,
      badge: null,
    },
    {
      id: "zk",
      title: t('steps.identity.zk'),
      description: t('steps.identity.zkDesc'),
      icon: Lock,
      badge: t('steps.identity.privacy'),
    },
    {
      id: "invite",
      title: t('steps.identity.invite'),
      description: t('steps.identity.inviteDesc'),
      icon: Key,
      badge: null,
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
          <strong className="text-foreground">{t('steps.identity.output')}</strong> {t('steps.identity.outputDesc')}
        </p>
      </div>
    </div>
  );
};

export default StepIdentity;
