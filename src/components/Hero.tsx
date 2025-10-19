import { Button } from "@/components/ui/button";
import { Globe, Sparkles, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

interface HeroProps {
  onStartWizard: () => void;
}

const Hero = ({ onStartWizard }: HeroProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-orbit"
            style={{
              top: `${50 + Math.sin(i) * 30}%`,
              left: `${50 + Math.cos(i) * 30}%`,
              animationDelay: `${i * 2.5}s`,
              animationDuration: `${20 + i * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="text-center z-10 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-6 mt-12 sm:mt-16">
          <div className="relative">
            <img src={logo} alt="Democracy Earth Logo" className="w-20 h-20 sm:w-24 sm:h-24 animate-float" />
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-glow" />
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight glow-text px-4">
          {t('hero.title')}
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-light px-4">
          {t('hero.tagline')}
        </p>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
          {t('hero.description')}
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 py-6 sm:py-8 px-4">
          <div className="flex items-center gap-2 text-foreground/80">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-xs sm:text-sm">{t('hero.proofOfHumanity')}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-xs sm:text-sm">{t('hero.aiPowered')}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-xs sm:text-sm">{t('hero.decentralized')}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
          <Button 
            onClick={onStartWizard}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg glow-border smooth-transition"
          >
            {t('hero.cta')}
          </Button>
          {user ? (
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Philosophy quote */}
        <div className="pt-12 max-w-2xl mx-auto">
          <blockquote className="text-muted-foreground italic text-sm md:text-base border-l-2 border-primary/50 pl-4">
            {t('hero.quote')}
            <footer className="text-xs mt-2 not-italic text-primary">
              — {t('hero.quoteAuthor')}
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
    </div>
  );
};

export default Hero;
