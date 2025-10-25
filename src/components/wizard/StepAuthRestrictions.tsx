import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Globe, List, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepAuthRestrictionsProps {
  authenticationType: string;
  onDataChange?: (data: any) => void;
}

const StepAuthRestrictions = ({ authenticationType, onDataChange }: StepAuthRestrictionsProps) => {
  const [restrictionType, setRestrictionType] = useState<string>("open");
  const [allowedEmails, setAllowedEmails] = useState<string>("");
  const [allowedDomains, setAllowedDomains] = useState<string>("");
  const [allowedPhones, setAllowedPhones] = useState<string>("");
  const [allowedCountries, setAllowedCountries] = useState<string>("");
  const [worldIdConfig, setWorldIdConfig] = useState<string>("");

  useEffect(() => {
    if (onDataChange) {
      const data: any = {
        restrictionType,
      };

      if (authenticationType === "email" || authenticationType === "google") {
        if (restrictionType === "email-list") {
          data.allowedEmails = allowedEmails.split("\n").filter(e => e.trim());
        } else if (restrictionType === "domain") {
          data.allowedDomains = allowedDomains.split(",").map(d => d.trim()).filter(d => d);
        }
      } else if (authenticationType === "phone") {
        if (restrictionType === "phone-list") {
          data.allowedPhones = allowedPhones.split("\n").filter(p => p.trim());
        } else if (restrictionType === "country") {
          data.allowedCountries = allowedCountries.split(",").map(c => c.trim()).filter(c => c);
        }
      } else if (authenticationType === "worldid") {
        data.worldIdConfig = worldIdConfig;
      }

      onDataChange(data);
    }
  }, [restrictionType, allowedEmails, allowedDomains, allowedPhones, allowedCountries, worldIdConfig, authenticationType, onDataChange]);

  const renderEmailGoogleRestrictions = () => (
    <div className="space-y-6">
      <RadioGroup value={restrictionType} onValueChange={setRestrictionType}>
        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="open" id="open" />
            <Label htmlFor="open" className="flex items-center gap-2 cursor-pointer flex-1">
              <Globe className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Open Access</div>
                <div className="text-sm text-muted-foreground">Anyone with {authenticationType} can vote</div>
              </div>
            </Label>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email-list" id="email-list" />
            <Label htmlFor="email-list" className="flex items-center gap-2 cursor-pointer flex-1">
              <List className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Allowed Email List</div>
                <div className="text-sm text-muted-foreground">Only specific email addresses can vote</div>
              </div>
            </Label>
          </div>
          {restrictionType === "email-list" && (
            <div className="mt-4 ml-8">
              <Textarea
                placeholder="Enter email addresses (one per line)&#10;example@domain.com&#10;another@example.org"
                value={allowedEmails}
                onChange={(e) => setAllowedEmails(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter one email address per line
              </p>
            </div>
          )}
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="domain" id="domain" />
            <Label htmlFor="domain" className="flex items-center gap-2 cursor-pointer flex-1">
              <Lock className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Domain Restriction</div>
                <div className="text-sm text-muted-foreground">Only emails from specific domains</div>
              </div>
            </Label>
          </div>
          {restrictionType === "domain" && (
            <div className="mt-4 ml-8">
              <Input
                placeholder="example.com, company.org"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter domain names separated by commas
              </p>
            </div>
          )}
        </Card>
      </RadioGroup>
    </div>
  );

  const renderPhoneRestrictions = () => (
    <div className="space-y-6">
      <RadioGroup value={restrictionType} onValueChange={setRestrictionType}>
        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="open" id="phone-open" />
            <Label htmlFor="phone-open" className="flex items-center gap-2 cursor-pointer flex-1">
              <Globe className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Open Access</div>
                <div className="text-sm text-muted-foreground">Any phone number can vote</div>
              </div>
            </Label>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="phone-list" id="phone-list" />
            <Label htmlFor="phone-list" className="flex items-center gap-2 cursor-pointer flex-1">
              <List className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Allowed Phone List</div>
                <div className="text-sm text-muted-foreground">Only specific phone numbers can vote</div>
              </div>
            </Label>
          </div>
          {restrictionType === "phone-list" && (
            <div className="mt-4 ml-8">
              <Textarea
                placeholder="Enter phone numbers with country code (one per line)&#10;+1234567890&#10;+9876543210"
                value={allowedPhones}
                onChange={(e) => setAllowedPhones(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter one phone number per line with country code (e.g., +1234567890)
              </p>
            </div>
          )}
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="country" id="country" />
            <Label htmlFor="country" className="flex items-center gap-2 cursor-pointer flex-1">
              <Lock className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Country Restriction</div>
                <div className="text-sm text-muted-foreground">Only phone numbers from specific countries</div>
              </div>
            </Label>
          </div>
          {restrictionType === "country" && (
            <div className="mt-4 ml-8">
              <Input
                placeholder="US, UK, CA, AU"
                value={allowedCountries}
                onChange={(e) => setAllowedCountries(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter country codes separated by commas (e.g., US, UK, CA)
              </p>
            </div>
          )}
        </Card>
      </RadioGroup>
    </div>
  );

  const renderWorldIdRestrictions = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="worldid-config" className="text-base font-semibold">World ID Configuration</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Configure World ID verification parameters
            </p>
          </div>
          <Textarea
            id="worldid-config"
            placeholder="Enter World ID configuration parameters (JSON format)&#10;{&#10;  &quot;verification_level&quot;: &quot;orb&quot;,&#10;  &quot;action&quot;: &quot;vote&quot;&#10;}"
            value={worldIdConfig}
            onChange={(e) => setWorldIdConfig(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            World ID provides proof-of-human verification. Configure verification level and action parameters.
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Access Restrictions</h2>
        <p className="text-muted-foreground">
          Configure who can participate in this vote using {authenticationType} authentication
        </p>
      </div>

      {(authenticationType === "email" || authenticationType === "google") && renderEmailGoogleRestrictions()}
      {authenticationType === "phone" && renderPhoneRestrictions()}
      {authenticationType === "worldid" && renderWorldIdRestrictions()}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Security Note:</strong> These restrictions will be enforced during the voting process to ensure only authorized users can participate.
        </p>
      </div>
    </div>
  );
};

export default StepAuthRestrictions;
