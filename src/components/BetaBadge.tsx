import { useTranslation } from "react-i18next";

const BetaBadge = () => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed top-0 left-0 z-50 overflow-hidden pointer-events-none">
      <div className="relative w-32 h-32">
        <div className="absolute -left-12 top-8 w-48 py-1.5 bg-accent/80 backdrop-blur-sm shadow-lg transform -rotate-45 origin-center">
          <p className="text-center text-xs font-semibold text-accent-foreground tracking-wider">
            {t('beta.version', 'BETA VERSION')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BetaBadge;
