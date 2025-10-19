import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, FileText, Shield, Target } from "lucide-react";

const StepBill = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  const [threshold, setThreshold] = useState("simple");

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">What Are We Voting On? 📜</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Time to write your proposal. Make it count—this is what democracy looks like.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="w-4 h-4 text-primary" />
            Proposal Title
          </Label>
          <Input
            id="title"
            placeholder="e.g., Let's Give Everyone Free Money (UBI Pilot) 💰"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm sm:text-base"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm sm:text-base">The Full Story</Label>
          <Textarea
            id="description"
            placeholder="Tell us everything. Use markdown, get fancy, make your case. This is your moment. ✍️"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="resize-none font-mono text-xs sm:text-sm"
          />
        </div>

        {/* Time window */}
        <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            Voting Time Window
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ongoing"
              checked={isOngoing}
              onCheckedChange={(checked) => {
                setIsOngoing(checked as boolean);
                if (checked) setEndDate("");
              }}
            />
            <Label
              htmlFor="ongoing"
              className="text-xs sm:text-sm font-normal cursor-pointer"
            >
              Ongoing election (no end date - real-time voting) ⏳
            </Label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs sm:text-sm">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs sm:text-sm">
                End Date {isOngoing && <span className="text-muted-foreground">(disabled)</span>}
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isOngoing}
                className="text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Outcome threshold */}
        <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Target className="w-4 h-4 text-primary" />
            Outcome Threshold
          </div>
          <div className="space-y-3">
            {[
              { id: "simple", label: "Simple Majority (>50%)" },
              { id: "supermajority", label: "Supermajority (>66%)" },
              { id: "unanimous", label: "Unanimous (100%)" },
              { id: "custom", label: "Custom threshold" },
            ].map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center smooth-transition ${
                    threshold === option.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30 group-hover:border-primary/50"
                  }`}
                >
                  {threshold === option.id && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span className="text-xs sm:text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Certification */}
        <Card className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <Shield className="w-4 h-4 text-primary" />
            Certification Type
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We'll timestamp your proposal, store it on IPFS, and anchor the hash on-chain. Translation: it's permanent, verifiable, and censorship-proof. 🛡️
          </p>
        </Card>
      </div>

      {/* Output preview */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Output:</strong> Proposal metadata will be stored 
          via IPFS and a cryptographic hash will be anchored on-chain for verification.
        </p>
      </div>
    </div>
  );
};

export default StepBill;
