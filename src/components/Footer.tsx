import { Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 backdrop-blur-sm bg-card/30 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4 text-primary" />
            <span>From Earth, with love 🌎</span>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground italic">
              "Democracy is not a place we go to vote. It's a protocol we all run."
            </p>
            <p className="text-xs text-primary mt-1">— Democracy Earth Foundation</p>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary smooth-transition">Open Source</a>
            <a href="#" className="hover:text-primary smooth-transition">Docs</a>
            <a href="#" className="hover:text-primary smooth-transition">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
