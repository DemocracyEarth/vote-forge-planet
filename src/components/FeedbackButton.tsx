import { MessageSquarePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const FeedbackButton = () => {
  const { t } = useTranslation();
  const { state } = useSidebar();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open('https://github.com/DemocracyEarth/vote-forge-planet/issues', '_blank')}
      className={`w-full ${state === "collapsed" ? "justify-center px-2" : "justify-start"}`}
    >
      <MessageSquarePlus className="w-4 h-4" />
      {state !== "collapsed" && (
        <span className="text-sm font-medium">
          {t('beta.feedback', 'Send Feedback')}
        </span>
      )}
    </Button>
  );
};

export default FeedbackButton;
