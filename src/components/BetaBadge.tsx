import { MessageSquarePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const BetaBadge = () => {
  const { t } = useTranslation();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => window.open('https://github.com/DemocracyEarth/vote-forge-planet/issues', '_blank')}
      className="fixed top-4 left-4 z-50 gap-2 px-3 py-1.5 h-auto rounded-full bg-primary/5 hover:bg-primary/10 backdrop-blur-sm border border-primary/20 shadow-sm transition-all"
    >
      <MessageSquarePlus className="w-3 h-3 text-primary" />
      <span className="text-xs font-medium text-primary/80">
        {t('beta.feedback', 'Beta - Send Feedback')}
      </span>
    </Button>
  );
};

export default BetaBadge;
