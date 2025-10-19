import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export const LLMSettings = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Load from localStorage on open
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem("llm_api_key") || "" : "";
  const savedModel = typeof window !== 'undefined' ? localStorage.getItem("llm_model") || "gpt-5-2025-08-07" : "gpt-5-2025-08-07";
  const savedLocally = typeof window !== 'undefined' ? localStorage.getItem("llm_save_locally") === "true" : false;
  
  const [apiKey, setApiKey] = useState(savedKey);
  const [model, setModel] = useState(savedModel);
  const [saveLocally, setSaveLocally] = useState(savedLocally);

  const handleSave = () => {
    if (saveLocally) {
      localStorage.setItem("llm_api_key", apiKey);
      localStorage.setItem("llm_model", model);
      localStorage.setItem("llm_save_locally", "true");
    } else {
      localStorage.removeItem("llm_api_key");
      localStorage.removeItem("llm_model");
      localStorage.removeItem("llm_save_locally");
    }

    toast({
      title: "Settings saved",
      description: saveLocally 
        ? "Your LLM settings have been saved locally." 
        : "Settings configured for this session only.",
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50"
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">LLM Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>LLM Configuration</DialogTitle>
          <DialogDescription>
            Configure the AI model that will generate your voting system HTML.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-5-2025-08-07">GPT-5 (Flagship)</SelectItem>
                <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini (Fast & Efficient)</SelectItem>
                <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 Nano (Fastest)</SelectItem>
                <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                <SelectItem value="o3-2025-04-16">O3 (Reasoning)</SelectItem>
                <SelectItem value="o4-mini-2025-04-16">O4 Mini (Fast Reasoning)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="save"
              checked={saveLocally}
              onCheckedChange={(checked) => setSaveLocally(checked as boolean)}
            />
            <Label
              htmlFor="save"
              className="text-sm font-normal cursor-pointer"
            >
              Save API key locally in browser
            </Label>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
