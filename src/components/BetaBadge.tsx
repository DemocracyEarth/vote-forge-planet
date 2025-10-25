import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const BetaBadge = () => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 shadow-sm">
      <Sparkles className="w-3 h-3 text-primary" />
      <span className="text-xs font-medium text-primary/80">
        {t('beta.label', 'Beta')}
      </span>
    </div>
  );
};

export default BetaBadge;
