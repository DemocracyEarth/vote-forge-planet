import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2, History as HistoryIcon, Share2, CheckCircle2, TrendingUp, Users, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/integrations/supabase/types";

type Election = Database["public"]["Tables"]["elections"]["Row"];

interface VoteResult {
  vote_value: string;
  vote_count: number;
  total_votes: number;
}

interface ParticipatedElection {
  id: string;
  election_id: string;
  voter_id: string;
  voted_at: string;
  elections: Election;
  userVote?: string;
  results?: VoteResult[];
}

interface DashboardParticipatedProps {
  userId: string;
}

export function DashboardParticipated({ userId }: DashboardParticipatedProps) {
  const [votedElections, setVotedElections] = useState<ParticipatedElection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadParticipatedElections();
    }
  }, [userId]);

  const loadParticipatedElections = async () => {
    try {
      const { data, error } = await supabase
        .from("voter_registry")
        .select("*, elections(*)")
        .eq("voter_id", userId)
        .order("voted_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user votes and results for each election
      const electionsWithVotes: ParticipatedElection[] = await Promise.all(
        (data || []).map(async (record): Promise<ParticipatedElection> => {
          // Try to find the vote by matching election and approximate timestamp
          const votedDate = new Date(record.voted_at);
          const timeWindow = 60000; // 60 second window to account for timing differences
          const startTime = new Date(votedDate.getTime() - timeWindow).toISOString();
          const endTime = new Date(votedDate.getTime() + timeWindow).toISOString();
          
          const { data: votes } = await supabase
            .from("anonymous_votes")
            .select("vote_value, voted_at")
            .eq("election_id", record.election_id)
            .gte("voted_at", startTime)
            .lte("voted_at", endTime)
            .limit(1);

          // Fetch live results for ongoing elections
          let results: VoteResult[] = [];
          const election = record.elections as Election;
          if (election.is_ongoing) {
            const { data: resultsData } = await supabase
              .rpc('get_election_results', { election_uuid: record.election_id });
            results = resultsData || [];
          }

          return {
            id: record.id,
            election_id: record.election_id,
            voter_id: record.voter_id,
            voted_at: record.voted_at,
            elections: election,
            userVote: votes && votes.length > 0 ? votes[0].vote_value : undefined,
            results
          };
        })
      );

      setVotedElections(electionsWithVotes);
    } catch (error) {
      console.error("Error loading participated elections:", error);
      toast({
        title: "Error",
        description: "Failed to load elections you participated in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyElectionLink = (electionId: string) => {
    const link = `${window.location.origin}/vote/${electionId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Election link copied to clipboard.",
    });
  };

  const shareToTwitter = (election: Election) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    const text = `Vote on: ${election.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
  };

  const shareToFacebook = (election: Election) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  const shareToLinkedIn = (election: Election) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, '_blank');
  };

  const shareToWhatsApp = (election: Election) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    const text = `Vote on: ${election.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Participated Elections
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your voting history and contributions
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
          <span className="text-sm font-semibold text-primary">{votedElections.length} Total</span>
        </div>
      </div>

      {votedElections.length === 0 ? (
        <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mb-6 shadow-lg shadow-primary/20">
              <HistoryIcon className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-2 font-semibold">No participation history yet</p>
            <p className="text-sm text-muted-foreground/70">Browse the public feed to find elections to participate in!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {votedElections.map((record) => {
            const election = record.elections as Election;
            const totalVotes = record.results?.reduce((acc, r) => acc + r.vote_count, 0) || 0;
            
            return (
              <Card 
                key={record.id}
                className="group border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:border-primary/50 backdrop-blur-sm overflow-hidden relative"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 rounded-lg opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300 mb-2">
                        {election.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>Voted {new Date(record.voted_at).toLocaleDateString()}</span>
                        </div>
                        {election.is_ongoing && (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30 font-semibold">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                            Live
                          </Badge>
                        )}
                      </div>
                    </div>
                    {totalVotes > 0 && (
                      <div className="flex flex-col items-end gap-1 px-4 py-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-2xl font-bold text-primary">{totalVotes}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Total Votes</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-6">
                  {/* Your Vote Section */}
                  {record.userVote && (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 backdrop-blur-sm space-y-3 shadow-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Your Vote</p>
                          <p className="text-xs text-muted-foreground">Cast anonymously and secured</p>
                        </div>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className="text-lg px-5 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-500/40 text-green-700 dark:text-green-300 font-bold shadow-md hover:shadow-lg transition-shadow"
                      >
                        {record.userVote}
                      </Badge>
                    </div>
                  )}

                  {/* Live Results Section */}
                  {election.is_ongoing && record.results && record.results.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Live Results</p>
                          <p className="text-xs text-muted-foreground">Real-time voting statistics</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {record.results
                          .sort((a, b) => b.vote_count - a.vote_count)
                          .map((result, idx) => {
                            const percentage = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0;
                            const isUserVote = result.vote_value === record.userVote;
                            
                            return (
                              <div 
                                key={result.vote_value}
                                className={`p-4 rounded-xl border transition-all duration-300 ${
                                  isUserVote 
                                    ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-primary/40 shadow-lg' 
                                    : 'bg-muted/50 border-muted hover:border-muted-foreground/20'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {idx === 0 && (
                                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold">
                                        Leading
                                      </Badge>
                                    )}
                                    <span className={`font-semibold ${isUserVote ? 'text-primary' : ''}`}>
                                      {result.vote_value}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold">{result.vote_count}</span>
                                    <span className={`text-sm font-semibold min-w-[3.5rem] text-right ${
                                      isUserVote ? 'text-primary' : 'text-muted-foreground'
                                    }`}>
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <Progress 
                                  value={percentage} 
                                  className={`h-2 ${isUserVote ? 'bg-primary/20' : ''}`}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/vote/${record.election_id}`)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Full Details
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-background border-border hover:bg-muted hover:border-border transition-all duration-300"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => copyElectionLink(record.election_id)}>
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareToTwitter(election)}>
                          Share on Twitter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareToFacebook(election)}>
                          Share on Facebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareToLinkedIn(election)}>
                          Share on LinkedIn
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareToWhatsApp(election)}>
                          Share on WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
