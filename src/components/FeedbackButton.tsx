import { MessageSquarePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface FeedbackButtonProps {
  collapsed?: boolean;
  isInSidebar?: boolean;
}

const FeedbackButton = ({ collapsed = false, isInSidebar = false }: FeedbackButtonProps) => {
  const { t } = useTranslation();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open('https://github.com/DemocracyEarth/vote-forge-planet/issues', '_blank')}
      className={`${isInSidebar ? 'w-full' : ''} ${collapsed ? "justify-center px-2" : "justify-start"} ${!isInSidebar ? 'gap-2' : ''}`}
    >
      <MessageSquarePlus className={`w-4 h-4 ${!collapsed && isInSidebar ? "mr-2" : ""}`} />
      {!collapsed && (
        <span className="text-sm font-medium">
          {t('beta.feedback', 'Send Feedback')}
        </span>
      )}
    </Button>
  );
};

export default FeedbackButton;
