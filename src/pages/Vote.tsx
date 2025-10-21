import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Vote as VoteIcon, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Footer from "@/components/Footer";

const Vote = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState<any>(null);
  const [voterIdentifier, setVoterIdentifier] = useState("");
  const [voteValue, setVoteValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadElection();
  }, [electionId]);

  const loadElection = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

      if (error) throw error;
      setElection(data);
    } catch (error) {
      console.error('Error loading election:', error);
      toast({
        title: "Error",
        description: "Failed to load election details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const finalVoteValue = election?.bill_config?.ballotOptions 
      ? selectedOptions.join(", ") 
      : voteValue;

    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          election_id: electionId,
          voter_identifier: voterIdentifier,
          vote_value: finalVoteValue,
          metadata: {
            voted_at: new Date().toISOString(),
          }
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Voted",
            description: "You have already cast your vote in this election",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Vote Recorded",
          description: "Your vote has been successfully recorded",
        });
        setVoterIdentifier("");
        setVoteValue("");
        setSelectedOptions([]);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Election Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg">
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="p-6 sm:p-8 card-glow">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 flex items-center gap-3">
              <VoteIcon className="w-8 h-8 text-primary" />
              {election.title}
            </h1>
            {election.description && (
              <p className="text-muted-foreground text-lg">{election.description}</p>
            )}
          </div>

          <div className="mb-8 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Election Details</h3>
              <div className="space-y-2 text-sm">
                {election.start_date && (
                  <p>Start: {new Date(election.start_date).toLocaleString()}</p>
                )}
                {election.is_ongoing ? (
                  <p className="text-primary font-semibold">Ongoing Election (No end date)</p>
                ) : election.end_date ? (
                  <p>End: {new Date(election.end_date).toLocaleString()}</p>
                ) : null}
                <p>Status: <span className="capitalize font-semibold">{election.status}</span></p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Voting Model</h3>
              <p className="text-sm capitalize">{election.voting_logic_config?.model || 'Direct Voting'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmitVote} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier">Your Identifier</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your email, ID, or identifier"
                value={voterIdentifier}
                onChange={(e) => setVoterIdentifier(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Based on: {election.identity_config?.verificationType || 'Email'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vote">Your Vote</Label>
              {election?.bill_config?.ballotOptions ? (
                election.bill_config.ballotType === "single" ? (
                  <RadioGroup
                    value={selectedOptions[0] || ""}
                    onValueChange={(value) => setSelectedOptions([value])}
                    required
                  >
                    {election.bill_config.ballotOptions.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="cursor-pointer font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    {election.bill_config.ballotOptions.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`option-${index}`}
                          checked={selectedOptions.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOptions([...selectedOptions, option]);
                            } else {
                              setSelectedOptions(selectedOptions.filter((o) => o !== option));
                            }
                          }}
                        />
                        <Label htmlFor={`option-${index}`} className="cursor-pointer font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <Textarea
                  id="vote"
                  placeholder="Enter your vote (Yes/No or your choice)"
                  value={voteValue}
                  onChange={(e) => setVoteValue(e.target.value)}
                  required
                  rows={4}
                />
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Vote...
                </>
              ) : (
                <>
                  <VoteIcon className="w-4 h-4 mr-2" />
                  Cast Your Vote
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Share this election</h4>
            <div className="flex gap-2">
              <Input 
                value={window.location.href} 
                readOnly 
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: "Link Copied",
                    description: "Election link copied to clipboard",
                  });
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Vote;