import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-border/50 backdrop-blur-sm bg-card/30 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4 text-primary" />
            <span>{t('footer.tagline')}</span>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground italic">
              {t('footer.quote')}
            </p>
            <p className="text-xs text-primary mt-1">— {t('footer.builtBy')}</p>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="https://github.com/DemocracyEarth/vote-forge-planet" target="_blank" rel="noopener noreferrer" className="hover:text-primary smooth-transition">{t('footer.openSource')}</a>
            <a href="#" className="hover:text-primary smooth-transition">{t('footer.docs')}</a>
            <a href="http://democracy.earth" target="_blank" rel="noopener noreferrer" className="hover:text-primary smooth-transition">{t('footer.foundation', 'Foundation')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
