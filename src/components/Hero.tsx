import { Button } from "@/components/ui/button";
import { Globe, Sparkles, Users } from "lucide-react";

interface HeroProps {
  onStartWizard: () => void;
}

const Hero = ({ onStartWizard }: HeroProps) => {
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
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Globe className="w-20 h-20 text-primary animate-float" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-glow" />
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight glow-text">
          Democracy Earth Protocol
        </h1>

        {/* Tagline */}
        <p className="text-2xl md:text-3xl text-muted-foreground font-light">
          Your programmable voting machine 🗳️✨
        </p>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Build democracy like you build code. Create votes, configure rules, and deploy governance—all from your browser. No borders. No gatekeepers. Just humans deciding together.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-6 py-8">
          <div className="flex items-center gap-2 text-foreground/80">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm">Proof of Humanity</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm">AI-Powered Logic</span>
          </div>
          <div className="flex items-center gap-2 text-foreground/80">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-sm">Decentralized</span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Button 
            onClick={onStartWizard}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg glow-border smooth-transition"
          >
            Start Voting 🚀
          </Button>
        </div>

        {/* Philosophy quote */}
        <div className="pt-12 max-w-2xl mx-auto">
          <blockquote className="text-muted-foreground italic text-sm md:text-base border-l-2 border-primary/50 pl-4">
            "Democracy isn't a place you visit—it's a protocol you run. Fork it. Remix it. Make it yours."
            <footer className="text-xs mt-2 not-italic text-primary">
              — Democracy Earth Foundation
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
