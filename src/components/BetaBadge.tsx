import { useTranslation } from "react-i18next";

const BetaBadge = () => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed bottom-0 right-0 z-50 overflow-hidden pointer-events-none">
      <div className="relative w-32 h-32">
        <div className="absolute -right-12 bottom-8 w-48 py-1 bg-muted/40 backdrop-blur-sm transform rotate-45 origin-center">
          <p className="text-center text-[10px] font-medium text-muted-foreground/60 tracking-wide">
            {t('beta.version', 'BETA VERSION')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BetaBadge;
