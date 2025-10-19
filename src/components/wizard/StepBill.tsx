import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, FileText, Shield, Target, Percent } from "lucide-react";

interface StepBillProps {
  votingModel: string;
  onDataChange?: (data: any) => void;
}

const StepBill = ({ votingModel, onDataChange }: StepBillProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  const [threshold, setThreshold] = useState("simple");
  const [customThreshold, setCustomThreshold] = useState("50");
  const [customOptions, setCustomOptions] = useState({
    delegationWeight: "1.0",
    voteCost: "1",
    reputationMinimum: "100",
  });

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        title,
        description,
        startDate,
        endDate,
        isOngoing,
        threshold,
        customThreshold: threshold === "custom" ? customThreshold : undefined,
        customOptions: threshold === "custom_logic" ? customOptions : undefined,
      });
    }
  }, [title, description, startDate, endDate, isOngoing, threshold, customThreshold, customOptions, onDataChange]);

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
              { id: "simple", label: "Simple Majority", value: "50" },
              { id: "supermajority", label: "Supermajority", value: "66" },
              { id: "unanimous", label: "Unanimous", value: "100" },
              { id: "custom", label: "Custom Logic" },
            ].map((option) => (
              <div key={option.id} className="space-y-2">
                <label
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setThreshold(option.id)}
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
                  <span className="text-xs sm:text-sm flex items-center gap-2">
                    {option.label}
                    {option.value && option.id !== "custom" && (
                      <span className="text-muted-foreground">({option.value}%)</span>
                    )}
                  </span>
                </label>
                
                {/* Editable percentage for non-custom options */}
                {threshold === option.id && option.id !== "custom" && (
                  <div className="ml-7 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={option.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (parseInt(value) >= 1 && parseInt(value) <= 100) {
                          // Update the threshold value
                        }
                      }}
                      className="w-20 text-xs"
                    />
                    <Percent className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom Logic Options based on Voting Model */}
          {threshold === "custom" && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              <p className="text-xs text-muted-foreground">
                Custom options for <span className="font-semibold text-foreground capitalize">{votingModel}</span> voting model:
              </p>

              {votingModel === "direct" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="customThreshold" className="text-xs">Custom Threshold (%)</Label>
                    <Input
                      id="customThreshold"
                      type="number"
                      min="1"
                      max="100"
                      value={customThreshold}
                      onChange={(e) => setCustomThreshold(e.target.value)}
                      className="text-xs"
                      placeholder="e.g., 75"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quorum" className="text-xs">Minimum Quorum (%)</Label>
                    <Input
                      id="quorum"
                      type="number"
                      min="1"
                      max="100"
                      defaultValue="20"
                      className="text-xs"
                      placeholder="e.g., 20"
                    />
                  </div>
                </div>
              )}

              {votingModel === "liquid" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="delegationWeight" className="text-xs">Delegation Weight Multiplier</Label>
                    <Input
                      id="delegationWeight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={customOptions.delegationWeight}
                      onChange={(e) => setCustomOptions({...customOptions, delegationWeight: e.target.value})}
                      className="text-xs"
                      placeholder="e.g., 1.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDelegations" className="text-xs">Max Delegation Chain Length</Label>
                    <Input
                      id="maxDelegations"
                      type="number"
                      min="1"
                      max="10"
                      defaultValue="3"
                      className="text-xs"
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liquidThreshold" className="text-xs">Approval Threshold (%)</Label>
                    <Input
                      id="liquidThreshold"
                      type="number"
                      min="1"
                      max="100"
                      value={customThreshold}
                      onChange={(e) => setCustomThreshold(e.target.value)}
                      className="text-xs"
                      placeholder="e.g., 60"
                    />
                  </div>
                </div>
              )}

              {votingModel === "quadratic" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="voteCost" className="text-xs">Vote Cost (Credits per Vote)</Label>
                    <Input
                      id="voteCost"
                      type="number"
                      min="1"
                      value={customOptions.voteCost}
                      onChange={(e) => setCustomOptions({...customOptions, voteCost: e.target.value})}
                      className="text-xs"
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxCredits" className="text-xs">Max Credits per Voter</Label>
                    <Input
                      id="maxCredits"
                      type="number"
                      min="1"
                      defaultValue="100"
                      className="text-xs"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quadraticThreshold" className="text-xs">Approval Threshold (Total √Credits)</Label>
                    <Input
                      id="quadraticThreshold"
                      type="number"
                      min="1"
                      value={customThreshold}
                      onChange={(e) => setCustomThreshold(e.target.value)}
                      className="text-xs"
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>
              )}

              {votingModel === "weighted" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="reputationMinimum" className="text-xs">Minimum Reputation Score</Label>
                    <Input
                      id="reputationMinimum"
                      type="number"
                      min="0"
                      value={customOptions.reputationMinimum}
                      onChange={(e) => setCustomOptions({...customOptions, reputationMinimum: e.target.value})}
                      className="text-xs"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightFormula" className="text-xs">Weight Calculation Formula</Label>
                    <Input
                      id="weightFormula"
                      type="text"
                      defaultValue="reputation * 0.01"
                      className="text-xs font-mono"
                      placeholder="e.g., reputation * 0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightedThreshold" className="text-xs">Approval Threshold (Weighted %)</Label>
                    <Input
                      id="weightedThreshold"
                      type="number"
                      min="1"
                      max="100"
                      value={customThreshold}
                      onChange={(e) => setCustomThreshold(e.target.value)}
                      className="text-xs"
                      placeholder="e.g., 55"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
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
