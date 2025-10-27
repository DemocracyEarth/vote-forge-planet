import { useState } from "react";
import { Sparkles, RefreshCw, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface IllustrationSectionProps {
  illustrationUrl: string;
  illustrationEnabled: boolean;
  isGenerating: boolean;
  customPrompt: string;
  onToggleEnabled: (enabled: boolean) => void;
  onCustomPromptChange: (prompt: string) => void;
  onRegenerate: () => void;
}

export const IllustrationSection = ({
  illustrationUrl,
  illustrationEnabled,
  isGenerating,
  customPrompt,
  onToggleEnabled,
  onCustomPromptChange,
  onRegenerate,
}: IllustrationSectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(customPrompt);

  const handleSaveAndRegenerate = () => {
    onCustomPromptChange(tempPrompt);
    setDialogOpen(false);
    onRegenerate();
  };

  return (
    <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          Social Media Preview Image
        </Label>
        <div className="flex items-center gap-2">
          <Switch
            checked={illustrationEnabled}
            onCheckedChange={onToggleEnabled}
            disabled={isGenerating}
          />
          <span className="text-xs text-muted-foreground">
            {illustrationEnabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      {illustrationEnabled && (
        <>
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating editorial illustration...
            </div>
          ) : illustrationUrl ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-32 h-16 rounded border overflow-hidden bg-background flex-shrink-0">
                  <img
                    src={illustrationUrl}
                    alt="Proposal preview illustration"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-1 flex-1">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs flex-1"
                        onClick={() => setTempPrompt(customPrompt)}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Customize
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Customize Illustration</DialogTitle>
                        <DialogDescription>
                          Add specific instructions for the illustration. The base editorial style will be maintained.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-prompt">Additional Instructions</Label>
                          <Textarea
                            id="custom-prompt"
                            placeholder="e.g., Include symbols of democracy, focus on urban elements, emphasize contrast..."
                            value={tempPrompt}
                            onChange={(e) => setTempPrompt(e.target.value)}
                            rows={4}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional: Add specific elements or themes you'd like to see in the illustration
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveAndRegenerate}>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onRegenerate}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Used when sharing on social media
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              An illustration will be automatically generated when you create the proposal
            </p>
          )}
        </>
      )}
    </div>
  );
};
