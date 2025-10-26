import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Shield, Plus, X, List, Sparkles, Settings, Coins, Scale, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

interface StepBillProps {
  votingModel: string;
  votingLogicData?: any;
  onDataChange?: (data: any) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const placeholderExamples = [
  "Should we implement a 4-day work week?",
  "Should we ban single-use plastics in our city?",
  "Should we increase funding for renewable energy research?",
  "Should we make voting mandatory in national elections?",
  "Should we implement universal basic income?",
  "Should we ban artificial intelligence in military applications?",
  "Should we require all new buildings to be carbon neutral?",
  "Should we implement a wealth tax on billionaires?",
  "Should we legalize recreational marijuana nationwide?",
  "Should we ban gasoline-powered cars by 2035?",
  "Should we mandate paid parental leave for all workers?",
  "Should we eliminate daylight saving time?",
  "Should we make community college tuition-free?",
  "Should we ban factory farming?",
  "Should we implement ranked choice voting?",
  "Should we require companies to disclose their carbon footprint?",
  "Should we ban genetic modification of human embryos?",
  "Should we implement a carbon tax?",
  "Should we guarantee housing as a human right?",
  "Should we ban cryptocurrency mining?",
  "Should we make election day a national holiday?",
  "Should we implement term limits for Congress?",
  "Should we ban TikTok for national security reasons?",
  "Should we require social media companies to verify user ages?",
  "Should we implement a robot tax on automated labor?",
  "Should we ban puppy mills nationwide?",
  "Should we require all packaging to be biodegradable?",
  "Should we eliminate the Electoral College?",
  "Should we ban targeted advertising based on personal data?",
  "Should we implement a maximum wage cap?",
  "Should we require all energy to be renewable by 2040?",
  "Should we ban private prisons?",
  "Should we implement universal healthcare?",
  "Should we ban facial recognition technology in public spaces?",
  "Should we require companies to have worker representation on boards?",
  "Should we ban trophy hunting?",
  "Should we implement a land value tax?",
  "Should we require all food to be labeled with its carbon footprint?",
  "Should we ban advertising to children?",
  "Should we implement a universal job guarantee?",
  "Should we ban billboards on highways?",
  "Should we require all new homes to have solar panels?",
  "Should we implement a maximum rental price cap?",
  "Should we ban algorithmic stock trading?",
  "Should we require all electronics to have a right to repair?",
  "Should we ban non-compete agreements?",
  "Should we implement a progressive consumption tax?",
  "Should we require all cities to have protected bike lanes?",
  "Should we ban microplastics in cosmetics?",
  "Should we implement a universal savings account system?",
  "Should we require all food waste to be composted?",
  "Should we ban gas stoves in new construction?",
  "Should we implement a federal job training program?",
  "Should we require all streaming services to pay artists fairly?",
  "Should we ban leaf blowers in residential areas?",
  "Should we implement congestion pricing in major cities?",
  "Should we require all hotels to eliminate single-use toiletries?",
  "Should we ban algorithmic pricing in housing markets?",
  "Should we implement a federal apprenticeship program?",
  "Should we require all lawns to be water-efficient landscaping?",
  "Should we ban puppy sales in pet stores?",
  "Should we implement a public banking option?",
  "Should we require all clothing to be labeled with labor conditions?",
  "Should we ban pesticides in urban areas?",
  "Should we implement a federal childcare program?",
  "Should we require all restaurants to compost food waste?",
  "Should we ban conversion therapy nationwide?",
  "Should we implement portable benefits for gig workers?",
  "Should we require all new appliances to be energy star rated?",
  "Should we ban invasive species as pets?",
  "Should we implement a federal reparations program?",
  "Should we require all schools to serve plant-based meals?",
  "Should we ban for-profit bail bonds?",
  "Should we implement a negative income tax?",
  "Should we require all products to display their environmental impact?",
  "Should we ban captive breeding of dolphins and whales?",
  "Should we implement a federal infrastructure jobs program?",
  "Should we require all companies to offer remote work options?",
  "Should we ban glitter in consumer products?",
  "Should we implement a progressive estate tax?",
  "Should we require all public buildings to have gender-neutral bathrooms?",
  "Should we ban non-recyclable packaging?",
  "Should we implement a federal music education program?",
  "Should we require all transportation to be zero-emission by 2050?",
  "Should we ban algorithmic hiring tools?",
  "Should we implement a federal arts funding program?",
  "Should we require all products to be repairable?",
  "Should we ban surveillance advertising?",
  "Should we implement a four-day school week?",
  "Should we require all cities to provide free public transit?",
  "Should we ban battery cages for chickens?",
  "Should we implement a federal broadband guarantee?",
  "Should we require all websites to be accessible to disabled users?",
  "Should we ban predatory lending practices?",
  "Should we implement a federal green jobs program?",
  "Should we require all airlines to offset their carbon emissions?",
  "Should we ban cosmetic animal testing?",
  "Should we implement a federal cultural heritage preservation program?",
  "Should we require all companies to publish diversity reports?",
];

const StepBill = ({ votingModel, votingLogicData, onDataChange, onValidationChange }: StepBillProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [ballotType, setBallotType] = useState<"single" | "multiple">("single");
  const [ballotOptions, setBallotOptions] = useState<string[]>(["YES", "NO", "ABSTENTION"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  // Voting model-specific settings
  const [tokenSettings, setTokenSettings] = useState({
    blockchain: "ethereum",
    contractAddress: "",
    tokenStandard: "ERC20",
  });
  const [quadraticSettings, setQuadraticSettings] = useState({
    creditsPerVoter: "100",
    voteCostFormula: "quadratic",
  });
  const [reputationSettings, setReputationSettings] = useState({
    minimumReputation: "100",
    weightFormula: "linear",
  });
  const [isPolishing, setIsPolishing] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const lastGeneratedTitleRef = useRef<string>("");
  const [showFullForm, setShowFullForm] = useState(false);
  const [placeholder] = useState(() => placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)]);

  const handleAddOption = () => {
    setBallotOptions([...ballotOptions, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (ballotOptions.length > 2) {
      setBallotOptions(ballotOptions.filter((_, i) => i !== index));
    }
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...ballotOptions];
    newOptions[index] = value;
    setBallotOptions(newOptions);
  };

  const handleGenerateDescription = useCallback(async () => {
    if (!title.trim() || title.trim().length === 0) {
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal-description", {
        body: { title: title.trim() },
      });

      if (error) throw error;

      if (data.description) {
        setDescription(data.description);
        
        // Also set ballot options if provided
        if (data.ballotOptions && Array.isArray(data.ballotOptions) && data.ballotOptions.length > 0) {
          setBallotOptions(data.ballotOptions);
        }
        
        toast({
          title: "Description generated! ✨",
          description: "AI created a comprehensive, neutral analysis of your proposal.",
        });
        lastGeneratedTitleRef.current = title.trim();
      }
    } catch (error: any) {
      console.error("Error generating description:", error);
      toast({
        title: "Failed to generate description",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  }, [title, toast]);

  const handlePolishProposal = async () => {
    if (!title && !description) {
      toast({
        title: "Nothing to polish",
        description: "Please add a title or description first.",
        variant: "destructive",
      });
      return;
    }

    setIsPolishing(true);
    try {
      const { data, error } = await supabase.functions.invoke("polish-proposal", {
        body: { title, description },
      });

      if (error) throw error;

      if (data.polishedTitle) setTitle(data.polishedTitle);
      if (data.polishedDescription) setDescription(data.polishedDescription);

      toast({
        title: "Proposal polished! ✨",
        description: "Your text has been made more neutral and objective.",
      });
    } catch (error: any) {
      console.error("Error polishing proposal:", error);
      toast({
        title: "Failed to polish",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPolishing(false);
    }
  };

  // Manual generation only - no auto-trigger
  useEffect(() => {
    // Just validation, no auto-generation
  }, [title, description, isGeneratingDescription, handleGenerateDescription]);

  // Validation effect
  useEffect(() => {
    let isValid = true;

    // Title validation: required, 1-500 characters
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || trimmedTitle.length > 500) {
      isValid = false;
    }

    // Description validation: max 10,000 characters
    if (description.length > 10000) {
      isValid = false;
    }

    // Ballot options validation: at least 2 non-empty options
    const validOptions = ballotOptions.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      isValid = false;
    }

    // Date validation: if not ongoing and both dates set, end must be after start
    if (!isOngoing && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        isValid = false;
      }
    }

    onValidationChange?.(isValid);
  }, [title, description, ballotOptions, isOngoing, startDate, endDate, onValidationChange]);

  useEffect(() => {
    if (onDataChange) {
      const modelSettings = votingModel === "token" 
        ? { tokenSettings }
        : votingModel === "quadratic"
        ? { quadraticSettings }
        : votingModel === "weighted"
        ? { reputationSettings }
        : {};

      onDataChange({
        title,
        description,
        ballotType,
        ballotOptions: ballotOptions.filter(opt => opt.trim() !== ""),
        startDate,
        endDate,
        isOngoing,
        ...modelSettings,
      });
    }
  }, [title, description, ballotType, ballotOptions, startDate, endDate, isOngoing, votingModel, tokenSettings, quadraticSettings, reputationSettings, onDataChange]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {!showFullForm ? (
        /* Initial prominent title input */
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 px-4">
          <div className="text-center space-y-3 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold glow-text">
              What should we vote on?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Just write a question or statement. Our AI will draft the entire proposal for you—complete with 
              balanced analysis, arguments from all perspectives, and voting options.
            </p>
          </div>
          
          <div className="w-full max-w-3xl space-y-3">
            <div className="relative">
              <Input
                id="title"
                placeholder={placeholder}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleTouched(true);
                }}
                onBlur={() => {
                  setTitleTouched(true);
                  if (title.trim().length >= 10) {
                    setShowFullForm(true);
                    // Trigger AI generation on blur
                    if (description.trim().length === 0 && lastGeneratedTitleRef.current !== title.trim()) {
                      handleGenerateDescription();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim().length >= 10) {
                    setShowFullForm(true);
                    // Trigger AI generation on Enter
                    if (description.trim().length === 0 && lastGeneratedTitleRef.current !== title.trim()) {
                      handleGenerateDescription();
                    }
                  }
                }}
                className={`text-base sm:text-lg h-14 px-6 ${
                  titleTouched && (title.trim().length === 0 || title.trim().length > 500) ? 'border-destructive' : ''
                }`}
                autoFocus
              />
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs ${
                title.trim().length > 500 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {title.trim().length}/500
              </span>
            </div>
            
            {titleTouched && title.trim().length > 0 && title.trim().length < 10 && (
              <p className="text-xs text-muted-foreground text-center">
                Keep typing... (at least 10 characters for AI to generate content)
              </p>
            )}
            {titleTouched && title.trim().length > 500 && (
              <p className="text-xs text-destructive text-center">
                Title must be 500 characters or less
              </p>
            )}
            {title.trim().length >= 10 && (
              <p className="text-xs text-primary text-center animate-pulse">
                ✨ Press Enter or click away to continue
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Your entire proposal will be drafted by AI—just provide the topic</span>
          </div>
        </div>
      ) : (
        /* Full form after title is entered */
        <>
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Review Your Proposal 📜</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              AI has analyzed your proposal. Review and customize the details below.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Title - Compact version */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="w-4 h-4 text-primary" />
                  Proposal Title
                </Label>
                <span className={`text-xs ${title.trim().length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {title.trim().length}/500
                </span>
              </div>
              <Input
                id="title"
                placeholder="e.g., Should we implement a 4-day work week?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`text-sm sm:text-base ${title.trim().length === 0 || title.trim().length > 500 ? 'border-destructive' : ''}`}
              />
              {title.trim().length === 0 && (
                <p className="text-xs text-destructive">Title is required</p>
              )}
              {title.trim().length > 500 && (
                <p className="text-xs text-destructive">Title must be 500 characters or less</p>
              )}
            </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm sm:text-base">
              The Full Story
              {isGeneratingDescription && (
                <span className="ml-2 text-xs text-primary animate-pulse">✨ AI is writing...</span>
              )}
            </Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${description.length > 10000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {description.length}/10,000
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription || !title.trim()}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {isGeneratingDescription ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
          </div>
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder="AI will generate a comprehensive, neutral analysis once you finish writing the title... ✨"
            disabled={!title.trim() && description.length === 0}
            isGenerating={isGeneratingDescription}
          />
          {description.length > 10000 ? (
            <p className="text-xs text-destructive">
              Description must be 10,000 characters or less
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              ✨ AI automatically generates a balanced, comprehensive analysis covering all perspectives when you write the title. You can also edit it manually or click Generate to regenerate.
            </p>
          )}
        </div>

        {/* Ballot Options */}
        <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <List className="w-4 h-4 text-primary" />
            {t('steps.bill.ballotOptions')}
          </div>

          {/* Choice Type Toggle */}
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center smooth-transition ${
                  ballotType === "single"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                }`}
                onClick={() => setBallotType("single")}
              >
                {ballotType === "single" && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              <span>{t('steps.bill.singleChoice')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center smooth-transition ${
                  ballotType === "multiple"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                }`}
                onClick={() => setBallotType("multiple")}
              >
                {ballotType === "multiple" && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              <span>{t('steps.bill.multipleChoice')}</span>
            </label>
          </div>

          {/* Options List */}
          <div className="space-y-2">
            {ballotOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleUpdateOption(index, e.target.value)}
                  placeholder={`${t('steps.bill.optionPlaceholder')} ${index + 1}`}
                  className="text-xs sm:text-sm"
                />
                {ballotOptions.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Option Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="w-full text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            {t('steps.bill.addOption')}
          </Button>

          {ballotOptions.filter(opt => opt.trim().length > 0).length < 2 && (
            <p className="text-xs text-destructive">
              At least 2 non-empty ballot options are required
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {ballotType === "single" 
              ? t('steps.bill.singleChoiceDesc')
              : t('steps.bill.multipleChoiceDesc')}
          </p>
        </Card>

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
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // If end date is set and is before new start date, clear it
                  if (endDate && e.target.value && new Date(endDate) <= new Date(e.target.value)) {
                    setEndDate("");
                    toast({
                      title: "End date cleared",
                      description: "End date must be after start date",
                      variant: "destructive",
                    });
                  }
                }}
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
                min={startDate || new Date().toISOString().slice(0, 16)}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const startDateTime = startDate ? new Date(startDate) : new Date();
                  
                  if (selectedDate <= startDateTime) {
                    toast({
                      title: "Invalid end date",
                      description: "End date must be after start date",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  setEndDate(e.target.value);
                }}
                disabled={isOngoing}
                className="text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!isOngoing && (
                <p className="text-xs text-muted-foreground">
                  Must be after start date
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Voting Model Specific Settings */}
        {votingModel === "token" && (
          <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Coins className="w-4 h-4 text-primary" />
              Token Voting Settings
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="blockchain" className="text-xs">Blockchain</Label>
                <select
                  id="blockchain"
                  value={tokenSettings.blockchain}
                  onChange={(e) => setTokenSettings({...tokenSettings, blockchain: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="optimism">Optimism</option>
                  <option value="base">Base</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenStandard" className="text-xs">Token Standard</Label>
                <select
                  id="tokenStandard"
                  value={tokenSettings.tokenStandard}
                  onChange={(e) => setTokenSettings({...tokenSettings, tokenStandard: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ERC20">ERC-20</option>
                  <option value="ERC721">ERC-721 (NFT)</option>
                  <option value="ERC1155">ERC-1155</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractAddress" className="text-xs">Smart Contract Address</Label>
                <Input
                  id="contractAddress"
                  type="text"
                  value={tokenSettings.contractAddress}
                  onChange={(e) => setTokenSettings({...tokenSettings, contractAddress: e.target.value})}
                  className="text-xs font-mono"
                  placeholder="0x..."
                />
                <p className="text-xs text-muted-foreground">
                  Token holders of this contract will be eligible to vote
                </p>
              </div>
            </div>
          </Card>
        )}

        {votingModel === "quadratic" && (
          <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Scale className="w-4 h-4 text-primary" />
              Quadratic Voting Settings
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="creditsPerVoter" className="text-xs">Credits Per Voter</Label>
                <Input
                  id="creditsPerVoter"
                  type="number"
                  min="1"
                  value={quadraticSettings.creditsPerVoter}
                  onChange={(e) => setQuadraticSettings({...quadraticSettings, creditsPerVoter: e.target.value})}
                  className="text-xs"
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">
                  Each voter receives this many credits to distribute
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voteCostFormula" className="text-xs">Vote Cost Formula</Label>
                <select
                  id="voteCostFormula"
                  value={quadraticSettings.voteCostFormula}
                  onChange={(e) => setQuadraticSettings({...quadraticSettings, voteCostFormula: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="quadratic">Quadratic (n²)</option>
                  <option value="linear">Linear (n)</option>
                  <option value="exponential">Exponential (2ⁿ)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Determines how voting power scales with credits spent
                </p>
              </div>
            </div>
          </Card>
        )}

        {votingModel === "weighted" && (
          <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Star className="w-4 h-4 text-primary" />
              Reputation-Based Voting Settings
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="minimumReputation" className="text-xs">Minimum Reputation Score</Label>
                <Input
                  id="minimumReputation"
                  type="number"
                  min="0"
                  value={reputationSettings.minimumReputation}
                  onChange={(e) => setReputationSettings({...reputationSettings, minimumReputation: e.target.value})}
                  className="text-xs"
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum reputation required to participate
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightFormula" className="text-xs">Weight Calculation</Label>
                <select
                  id="weightFormula"
                  value={reputationSettings.weightFormula}
                  onChange={(e) => setReputationSettings({...reputationSettings, weightFormula: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="linear">Linear (reputation × 1)</option>
                  <option value="sqrt">Square Root (√reputation)</option>
                  <option value="log">Logarithmic (log₂ reputation)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  How reputation translates to voting weight
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Liquid Delegation Status */}
        {votingLogicData?.allowLiquidDelegation && (
          <Card className="p-3 sm:p-4 bg-accent/10 border-accent/20">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Settings className="w-4 h-4 text-accent" />
              <span className="font-medium">Liquid Delegation Enabled</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Voters can delegate their voting power to trusted representatives
            </p>
          </Card>
        )}

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

        {/* Output preview */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Output:</strong> Proposal metadata will be stored 
            via IPFS and a cryptographic hash will be anchored on-chain for verification.
          </p>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default StepBill;
