import { MessageSquarePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const FeedbackButton = () => {
  const { t } = useTranslation();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open('https://github.com/DemocracyEarth/vote-forge-planet/issues', '_blank')}
      className="gap-2 w-full justify-start"
    >
      <MessageSquarePlus className="w-4 h-4" />
      <span className="text-sm font-medium">
        {t('beta.feedback', 'Send Feedback')}
      </span>
    </Button>
  );
};

export default FeedbackButton;
