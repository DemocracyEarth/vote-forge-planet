import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, Shield, Target } from "lucide-react";

const StepBill = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [threshold, setThreshold] = useState("simple");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Bill & Certification</h2>
        <p className="text-muted-foreground">
          Define what is being voted on and set voting parameters.
        </p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Bill Title
          </Label>
          <Input
            id="title"
            placeholder="e.g., Universal Basic Income Pilot Program"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Full Proposal Text</Label>
          <Textarea
            id="description"
            placeholder="Enter the full text of your proposal in markdown format..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="resize-none font-mono text-sm"
          />
        </div>

        {/* Time window */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            Voting Time Window
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Outcome threshold */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
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
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Certification */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="w-4 h-4 text-primary" />
            Certification Type
          </div>
          <p className="text-xs text-muted-foreground">
            Your proposal will be timestamped and stored on IPFS with a signed hash recorded 
            on-chain for immutability and verification.
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
