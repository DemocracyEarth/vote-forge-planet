import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
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
import { useTranslation } from "react-i18next";

const Vote = () => {
  const { t } = useTranslation();
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [election, setElection] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [voterIdentifier, setVoterIdentifier] = useState("");
  const [voteValue, setVoteValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [voteResults, setVoteResults] = useState<Record<string, number>>({});

  useEffect(() => {
    loadElection();
    checkUser();
  }, [electionId]);

  useEffect(() => {
    if (user && election) {
      // Auto-populate identifier based on auth method
      const authMethod = user.app_metadata?.provider || 'email';
      let identifier = '';
      
      if (authMethod === 'google') {
        identifier = user.email || '';
      } else if (authMethod === 'phone') {
        identifier = user.phone || '';
      } else {
        identifier = user.email || '';
      }
      
      setVoterIdentifier(identifier);
    }
  }, [user, election]);

  useEffect(() => {
    if (!election?.is_ongoing) return;

    // Load initial vote results
    loadVoteResults();

    // Set up realtime subscription for ongoing elections
    const channel = supabase
      .channel('vote-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `election_id=eq.${electionId}`
        },
        () => {
          loadVoteResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [election?.is_ongoing, electionId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadVoteResults = async () => {
    try {
      const { data: votes, error } = await supabase
        .from('votes')
        .select('vote_value')
        .eq('election_id', electionId);

      if (error) throw error;

      // Aggregate vote results
      const results: Record<string, number> = {};
      votes?.forEach(vote => {
        const values = vote.vote_value.split(', ');
        values.forEach(value => {
          results[value] = (results[value] || 0) + 1;
        });
      });

      setVoteResults(results);
    } catch (error) {
      console.error('Error loading vote results:', error);
    }
  };

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
        title: t('vote.failedToLoad'),
        description: t('vote.failedToLoad'),
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
            title: t('vote.alreadyVoted'),
            description: t('vote.alreadyVotedDesc'),
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: t('vote.voteRecorded'),
          description: t('vote.voteRecordedDesc'),
        });
        setVoterIdentifier("");
        setVoteValue("");
        setSelectedOptions([]);
        
        // Redirect after successful vote
        setTimeout(() => {
          navigate(user ? '/dashboard' : '/');
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: t('auth.error'),
        description: t('vote.failedToSubmit'),
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
          <h1 className="text-2xl font-bold mb-4">{t('vote.electionNotFound')}</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('vote.goHome')}
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
          onClick={() => navigate(user ? '/dashboard' : '/')} 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {user ? t('vote.backToDashboard') : t('vote.backToHome')}
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
              <h3 className="font-semibold mb-2">{t('vote.electionDetails')}</h3>
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
                placeholder={user ? "Auto-filled from your account" : "Enter your email, ID, or identifier"}
                value={voterIdentifier}
                onChange={(e) => setVoterIdentifier(e.target.value)}
                readOnly={!!user}
                required
                className={user ? "bg-muted cursor-not-allowed" : ""}
              />
              <div className="text-xs space-y-1">
                <p className="text-muted-foreground">
                  Required: {election.identity_config?.verificationType || 'Email'}
                </p>
                {user && (() => {
                  const authMethod = user.app_metadata?.provider || 'email';
                  const requiredType = election.identity_config?.verificationType?.toLowerCase() || 'email';
                  const userType = authMethod === 'google' ? 'email' : authMethod;
                  const matches = requiredType.includes(userType) || userType.includes(requiredType);
                  
                  return (
                    <p className={matches ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                      {matches ? "✓ Your authentication matches the election requirements" : "⚠ Your authentication type may not match the election requirements"}
                    </p>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Your Vote</Label>
              {election?.bill_config?.ballotOptions ? (
                <div className="grid gap-3">
                  {election.bill_config.ballotOptions.map((option: string, index: number) => (
                    <Button
                      key={index}
                      type="button"
                      variant={
                        election.bill_config.ballotType === "single"
                          ? selectedOptions[0] === option ? "default" : "outline"
                          : selectedOptions.includes(option) ? "default" : "outline"
                      }
                      className="h-auto py-4 px-6 text-lg justify-start"
                      onClick={() => {
                        if (election.bill_config.ballotType === "single") {
                          setSelectedOptions([option]);
                        } else {
                          if (selectedOptions.includes(option)) {
                            setSelectedOptions(selectedOptions.filter((o) => o !== option));
                          } else {
                            setSelectedOptions([...selectedOptions, option]);
                          }
                        }
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
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
              {election?.bill_config?.ballotType === "multiple" && selectedOptions.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected
                </p>
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

          {election?.is_ongoing && Object.keys(voteResults).length > 0 && (
            <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
              <h4 className="font-semibold mb-4 text-lg">Live Results</h4>
              <div className="space-y-3">
                {Object.entries(voteResults)
                  .sort(([, a], [, b]) => b - a)
                  .map(([option, count]) => {
                    const total = Object.values(voteResults).reduce((sum, val) => sum + val, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={option} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{option}</span>
                          <span className="text-muted-foreground">{count} votes ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">{t('vote.shareElection')}</h4>
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
                    title: t('vote.linkCopied'),
                    description: t('vote.linkCopiedDesc'),
                  });
                }}
              >
                {t('vote.copy')}
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