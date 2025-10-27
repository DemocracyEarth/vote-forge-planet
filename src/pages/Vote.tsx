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
import { Loader2, Vote as VoteIcon, ArrowLeft, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DiscussionThread } from "@/components/DiscussionThread";
import { LiveResults } from "@/components/LiveResults";
import { ElectionCountdown } from "@/components/ElectionCountdown";
import { marked } from "marked";

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
  const [creator, setCreator] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [previousVoteLoaded, setPreviousVoteLoaded] = useState(false);
  const [delegatorInfo, setDelegatorInfo] = useState<{
    count: number;
    delegators: any[];
  } | null>(null);

  // Check if election is closed
  const isElectionClosed = () => {
    if (!election) return false;
    if (election.is_ongoing) return false;
    if (!election.end_date) return false;
    return new Date(election.end_date) < new Date();
  };

  useEffect(() => {
    loadElection();
    checkUser();
    // Reset previous vote state when election changes
    setPreviousVoteLoaded(false);
    setHasVoted(false);
    setSelectedOptions([]);
    setVoteValue("");
  }, [electionId]);

  // Load previous vote when user and election are available
  useEffect(() => {
    if (user && election && !previousVoteLoaded) {
      loadPreviousVote();
      loadDelegatorInfo();
    }
  }, [user, election, previousVoteLoaded]);

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
    if (!election) return;

    // Load initial vote results for all elections
    loadVoteResults();

    // Set up realtime subscription only for ongoing elections
    if (election.is_ongoing) {
      const channel = supabase
        .channel('vote-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'anonymous_votes',
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
    }
  }, [election, electionId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadPreviousVote = async () => {
    if (!user || !election) return;
    
    try {
      // Check if user has voted and get their vote
      const { data: registry } = await supabase
        .from('voter_registry')
        .select('vote_id')
        .eq('election_id', electionId)
        .eq('voter_id', user.id)
        .maybeSingle();

      if (registry?.vote_id) {
        setHasVoted(true);
        
        // Get the actual vote value
        const { data: vote } = await supabase
          .from('anonymous_votes')
          .select('vote_value')
          .eq('id', registry.vote_id)
          .single();

        if (vote?.vote_value) {
          // Pre-populate the form with previous vote
          if (election.bill_config?.ballotOptions) {
            // For ballot options, split by comma if multiple choice
            const previousSelections = vote.vote_value.split(", ").filter(Boolean);
            setSelectedOptions(previousSelections);
          } else {
            // For free text
            setVoteValue(vote.vote_value);
          }
        }
      }
      
      setPreviousVoteLoaded(true);
    } catch (error) {
      console.error('Error loading previous vote:', error);
      setPreviousVoteLoaded(true);
    }
  };

  const loadVoteResults = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_election_results', { election_uuid: electionId });

      if (error) throw error;

      // Convert RPC results to the format expected by LiveResults
      const results: Record<string, number> = {};
      data?.forEach((item: any) => {
        // Filter out null vote values (when there are no votes yet)
        if (item.vote_value !== null) {
          results[item.vote_value] = item.vote_count;
        }
      });

      setVoteResults(results);
    } catch (error) {
      console.error('Error loading vote results:', error);
    }
  };

  const loadDelegatorInfo = async () => {
    if (!user || !election) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_valid_delegators_for_election', {
          delegate_user_id: user.id,
          election_id: electionId
        });
        
      if (error) {
        console.error('Error loading delegator info:', error);
        return;
      }
      
      const result = data?.[0];
      const delegators = Array.isArray(result?.delegators) ? result.delegators : [];
      
      setDelegatorInfo({
        count: result?.delegator_count || 0,
        delegators: delegators
      });
    } catch (error) {
      console.error('Error loading delegator info:', error);
    }
  };

  const loadElection = async () => {
    try {
      // Fetch only necessary fields to prevent sensitive config exposure
      const { data, error } = await supabase
        .from('elections')
        .select('id, title, description, start_date, end_date, is_ongoing, status, is_public, identity_config, voting_logic_config, bill_config, created_by')
        .eq('id', electionId)
        .single();

      if (error) throw error;
      setElection(data);

      // Load creator profile if available
      if (data?.created_by) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.created_by)
          .single();
        
        if (profileData) {
          setCreator(profileData);
        }
      }
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
    
    // Check if election is closed
    if (isElectionClosed()) {
      toast({
        title: "Election Closed",
        description: "This election has ended and is no longer accepting votes.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);

    const finalVoteValue = election?.bill_config?.ballotOptions 
      ? selectedOptions.join(", ") 
      : voteValue;

    try {
      if (!user) {
        toast({
          title: t('auth.error'),
          description: "You must be logged in to vote",
          variant: "destructive",
        });
        return;
      }

      // If user has already voted, update their vote
      if (hasVoted) {
        // Allow vote override if election is ongoing
        if (election.is_ongoing) {
          toast({
            title: t('vote.updatingVote'),
            description: t('vote.updatingVoteDesc'),
          });

          // Get the user's previous vote reference from voter_registry
          const { data: previousVote } = await supabase
            .from('voter_registry')
            .select('vote_id')
            .eq('election_id', electionId)
            .eq('voter_id', user.id)
            .single();

          // Update the existing vote instead of deleting and creating new
          if (previousVote?.vote_id) {
            const { error: updateVoteError } = await supabase
              .from('anonymous_votes')
              .update({
                vote_value: finalVoteValue,
                vote_weight: (delegatorInfo?.count || 0) + 1,
                voted_at: new Date().toISOString(),
                metadata: {
                  voted_at: new Date().toISOString(),
                  updated: true,
                  delegations_count: delegatorInfo?.count || 0
                }
              })
              .eq('id', previousVote.vote_id);

            if (updateVoteError) throw updateVoteError;
          }

          toast({
            title: t('vote.voteRecorded'),
            description: "Your vote has been updated successfully",
          });
          
          // Reload results to show updated voting data
          await loadVoteResults();
          await loadPreviousVote(); // Reload to show updated selection
          setSubmitting(false);
          return;
        } else {
          toast({
            title: t('vote.alreadyVoted'),
            description: t('vote.alreadyVotedDesc'),
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      // Insert the anonymous vote first
      const { data: newVote, error: voteError } = await supabase
        .from('anonymous_votes')
        .insert({
          election_id: electionId,
          vote_value: finalVoteValue,
          vote_weight: (delegatorInfo?.count || 0) + 1,
          metadata: {
            voted_at: new Date().toISOString(),
            delegations_count: delegatorInfo?.count || 0
          }
        })
        .select('id')
        .single();

      if (voteError) throw voteError;

      // Register voter with reference to the vote
      const { error: registryError } = await supabase
        .from('voter_registry')
        .insert({
          election_id: electionId,
          voter_id: user.id,
          vote_id: newVote.id,
        });

      if (registryError) {
        // Handle duplicate gracefully by treating as update when election is ongoing
        if (registryError.code === '23505') {
          if (election.is_ongoing) {
            toast({
              title: t('vote.updatingVote'),
              description: t('vote.updatingVoteDesc'),
            });

            // Get existing vote reference to delete it
            const { data: existingReg } = await supabase
              .from('voter_registry')
              .select('vote_id')
              .eq('election_id', electionId)
              .eq('voter_id', user.id)
              .single();

            if (existingReg?.vote_id) {
              await supabase
                .from('anonymous_votes')
                .delete()
                .eq('id', existingReg.vote_id);
            }

            // Update voter registry with new vote_id
            const { error: updateError } = await supabase
              .from('voter_registry')
              .update({ vote_id: newVote.id })
              .eq('election_id', electionId)
              .eq('voter_id', user.id);

            if (updateError) throw updateError;

            toast({
              title: t('vote.voteRecorded'),
              description: t('vote.voteRecordedDesc'),
            });
            setVoterIdentifier("");
            setVoteValue("");
            setSelectedOptions([]);
            
            // Reload results to show updated voting data
            await loadVoteResults();
            return;
          } else {
            toast({
              title: t('vote.alreadyVoted'),
              description: t('vote.alreadyVotedDesc'),
              variant: "destructive",
            });
            return;
          }
        } else {
          throw registryError;
        }
      }

      toast({
        title: t('vote.voteRecorded'),
        description: t('vote.voteRecordedDesc'),
      });
      
      // Mark as voted and reload
      setHasVoted(true);
      await loadVoteResults();
      await loadPreviousVote(); // Load the vote we just cast
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
      {/* Top controls */}
      <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50">
        <Button 
          variant="outline" 
          onClick={() => navigate(user ? '/dashboard' : '/')}
          className="h-9"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">{user ? 'Dashboard' : 'Home'}</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl pt-20">
        <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-xl">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          
          <div className="relative p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="mb-4 sm:mb-8 pb-4 sm:pb-6 border-b border-border/50">
              {/* Mobile: Icon above, Desktop: Icon left */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm w-fit">
                  <VoteIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {election.title}
                  </h1>
                  {creator && (
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary/20">
                        <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {creator.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Created by <span className="font-semibold text-foreground">{creator.full_name}</span>
                      </div>
                    </div>
                  )}
                  {election.description && (
                    <div 
                      className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed prose prose-sm sm:prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: marked(election.description) }}
                    />
                  )}
                </div>
              </div>

              {/* Social Media Preview Image */}
              {election.bill_config?.illustrationUrl && (
                <div className="mt-4 sm:mt-6">
                  <div className="max-w-md mx-auto rounded-lg border overflow-hidden bg-muted/30 shadow-sm" style={{ aspectRatio: '1.91/1' }}>
                    <img
                      src={election.bill_config.illustrationUrl}
                      alt={`Illustration for ${election.title}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Election Details Grid */}
            <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Countdown Component */}
              <div className="md:col-span-2">
                <ElectionCountdown 
                  startDate={election.start_date}
                  endDate={election.end_date}
                  isOngoing={election.is_ongoing}
                />
              </div>
              
              {/* Closed Election Banner */}
              {isElectionClosed() && (
                <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-r from-gray-500/20 to-gray-500/10 border-2 border-gray-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-500/20">
                      <VoteIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-600 dark:text-gray-400">Election Closed</p>
                      <p className="text-sm text-muted-foreground">
                        This election ended on {new Date(election.end_date!).toLocaleString()}. You can view results but cannot cast new votes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="group p-4 rounded-xl bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm border border-border/50 hover:border-primary/30 smooth-transition">
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  {t('vote.electionDetails')}
                </h3>
                <div className="space-y-2 text-sm">
                  {election.start_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-20 font-medium">Start:</span>
                      <span>{new Date(election.start_date).toLocaleString()}</span>
                    </div>
                  )}
                  {election.is_ongoing ? (
                    <div className="flex items-center gap-2">
                      <span className="w-20 font-medium text-muted-foreground">Status:</span>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                        ● Ongoing Election
                      </span>
                    </div>
                  ) : election.end_date ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-20 font-medium">End:</span>
                      <span>{new Date(election.end_date).toLocaleString()}</span>
                    </div>
                  ) : null}
                  {!election.is_ongoing && (
                    <div className="flex items-center gap-2">
                      <span className="w-20 font-medium text-muted-foreground">Status:</span>
                      <span className="capitalize font-semibold">{election.status}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="group p-4 rounded-xl bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm border border-border/50 hover:border-accent/30 smooth-transition">
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Voting Model
                </h3>
                <p className="text-sm font-medium capitalize px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 inline-block">
                  {election.voting_logic_config?.model || 'Direct Voting'}
                </p>
              </div>
            </div>

            {/* Delegation Power Display */}
            {!isElectionClosed() && delegatorInfo && delegatorInfo.count > 0 && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold text-lg">Your Voting Power</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You're representing <span className="font-bold text-primary">{delegatorInfo.count + 1}</span> {delegatorInfo.count + 1 === 1 ? 'person' : 'people'} in this vote
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-3 rounded bg-card/50 border border-border/50">
                      <p className="text-muted-foreground text-xs mb-1">Your vote</p>
                      <p className="font-bold text-lg">1</p>
                    </div>
                    <div className="p-3 rounded bg-card/50 border border-border/50">
                      <p className="text-muted-foreground text-xs mb-1">Delegated</p>
                      <p className="font-bold text-primary text-lg">{delegatorInfo.count}</p>
                    </div>
                    <div className="p-3 rounded bg-primary/10 border border-primary/30">
                      <p className="text-muted-foreground text-xs mb-1">Total power</p>
                      <p className="font-bold text-primary text-lg">{delegatorInfo.count + 1}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Voting Form Section */}
            <form onSubmit={handleSubmitVote} className="space-y-8">
              {/* Identifier Section */}
              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                <Label htmlFor="identifier" className="text-base font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Your Identifier
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={user ? "Auto-filled from your account" : "Enter your email, ID, or identifier"}
                  value={voterIdentifier}
                  onChange={(e) => setVoterIdentifier(e.target.value)}
                  readOnly={!!user}
                  required
                  className={user ? "bg-muted/50 cursor-not-allowed border-border/50" : "bg-background/50 backdrop-blur-sm"}
                />
                <div className="text-xs space-y-2 pl-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Required:</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {election.identity_config?.verificationType || 'Email'}
                    </span>
                  </div>
                  {user && (() => {
                    const authMethod = user.app_metadata?.provider || 'email';
                    const requiredType = election.identity_config?.verificationType?.toLowerCase() || 'email';
                    const userType = authMethod === 'google' ? 'email' : authMethod;
                    const matches = requiredType.includes(userType) || userType.includes(requiredType);
                    
                    return (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${matches ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"}`}>
                        <span className="font-medium">{matches ? "✓" : "⚠"}</span>
                        <span className="text-xs">
                          {matches ? "Your authentication matches the election requirements" : "Your authentication type may not match the election requirements"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Vote Selection Section */}
              {!isElectionClosed() && (
                <>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      Your Vote
                    </Label>
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
                        className={`h-auto py-5 px-6 text-lg justify-start font-medium smooth-transition ${
                          (election.bill_config.ballotType === "single" ? selectedOptions[0] === option : selectedOptions.includes(option))
                            ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 border-primary"
                            : "bg-card/60 backdrop-blur-sm hover:bg-card/80 hover:border-primary/40"
                        }`}
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
                        <span className="flex items-center gap-3">
                          {(election.bill_config.ballotType === "single" ? selectedOptions[0] === option : selectedOptions.includes(option)) && (
                            <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                          )}
                          {option}
                        </span>
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
                    className="bg-background/50 backdrop-blur-sm resize-none"
                  />
                )}
                {election?.bill_config?.ballotType === "multiple" && selectedOptions.length > 0 && (
                  <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 w-fit">
                      <span className="font-semibold">{selectedOptions.length}</span>
                      <span>option{selectedOptions.length !== 1 ? 's' : ''} selected</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 smooth-transition" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Vote...
                    </>
                  ) : delegatorInfo && delegatorInfo.count > 0 ? (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Cast {delegatorInfo.count + 1} Votes (Your Power: {delegatorInfo.count + 1})
                    </>
                  ) : (
                    <>
                      <VoteIcon className="w-5 h-5 mr-2" />
                      Cast Your Vote
                    </>
                  )}
                </Button>
                </>
              )}
            </form>

            {/* Results Section */}
            {Object.keys(voteResults).length > 0 && (
              <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  {election?.is_ongoing && (
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                      <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-ping" />
                    </div>
                  )}
                  <h4 className="font-semibold text-lg">
                    {election?.is_ongoing ? 'Live Results' : 'Final Results'}
                  </h4>
                </div>
                <div className="space-y-4">
                  {Object.entries(voteResults)
                    .sort(([, a], [, b]) => b - a)
                    .map(([option, count], index) => {
                      const total = Object.values(voteResults).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={option} className="space-y-2 p-4 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 smooth-transition">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {index === 0 && total > 0 && (
                                <span className="text-lg">🥇</span>
                              )}
                              <span className="font-semibold text-base">{option}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground font-medium">{count} votes</span>
                              <span className="text-lg font-bold text-primary">{percentage}%</span>
                            </div>
                          </div>
                          <div className="h-3 bg-muted/50 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-700 ease-out rounded-full shadow-lg shadow-primary/30"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Share Section */}
          <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 backdrop-blur-sm">
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <div className="w-1 h-4 bg-accent rounded-full" />
              {t('vote.shareElection')}
            </h4>
            <div className="flex gap-2 mb-3">
              <Input 
                value={`https://ai.democracy.earth/vote/${electionId}`} 
                readOnly 
                className="text-xs bg-background/50 backdrop-blur-sm border-border/50"
              />
              <Button
                variant="outline"
                size="sm"
                className="bg-accent/10 hover:bg-accent/20 border-accent/30 hover:border-accent text-accent font-medium smooth-transition"
                onClick={() => {
                  navigator.clipboard.writeText(`https://ai.democracy.earth/vote/${electionId}`);
                  toast({
                    title: t('vote.linkCopied'),
                    description: t('vote.linkCopiedDesc'),
                  });
                }}
              >
                {t('vote.copy')}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border-[#1DA1F2]/30 hover:border-[#1DA1F2] text-[#1DA1F2] font-medium smooth-transition"
              onClick={() => {
                const url = `https://ai.democracy.earth/vote/${electionId}`;
                const text = `Vote on: ${election.title}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Share on X
            </Button>
          </div>
        </Card>

        {/* Live Results Section */}
        <div className="mt-8">
          <LiveResults 
            voteResults={voteResults}
            votingLogicConfig={election.voting_logic_config}
            ballotOptions={election.bill_config?.ballotOptions}
          />
        </div>

        {/* Discussion Section */}
        <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-xl mt-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative p-6 sm:p-8">
            <DiscussionThread electionId={electionId!} userId={user?.id || null} />
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Vote;