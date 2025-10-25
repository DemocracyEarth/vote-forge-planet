import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2, History as HistoryIcon, Share2, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";

type Election = Database["public"]["Tables"]["elections"]["Row"];

interface ParticipatedElection {
  id: string;
  election_id: string;
  voter_id: string;
  voted_at: string;
  elections: Election;
  userVote?: string;
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
      
      // Fetch user votes for each election
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

          return {
            id: record.id,
            election_id: record.election_id,
            voter_id: record.voter_id,
            voted_at: record.voted_at,
            elections: record.elections as Election,
            userVote: votes && votes.length > 0 ? votes[0].vote_value : undefined
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
              <HistoryIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">No participation history yet</p>
            <p className="text-sm text-muted-foreground/70">Browse the public feed to find elections to participate in!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {votedElections.map((record) => {
            const election = record.elections as Election;
            return (
              <Card 
                key={record.id}
                className="group border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/40 backdrop-blur-sm overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {election.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Voted on {new Date(record.voted_at).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    {/* Vote Information */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <p className="font-semibold text-lg text-primary">Voted</p>
                      </div>
                      
                      {record.userVote && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Your vote:</p>
                          <Badge 
                            variant="outline" 
                            className="text-base px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 font-semibold"
                          >
                            {record.userVote}
                          </Badge>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {record.userVote 
                          ? "Your vote was cast anonymously and is stored securely" 
                          : "Your vote was cast anonymously"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/vote/${record.election_id}`)}
                        className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:from-primary/20 hover:to-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Election
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
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
