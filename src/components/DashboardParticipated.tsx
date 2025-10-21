import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2, History as HistoryIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Election = Database["public"]["Tables"]["elections"]["Row"];
type Vote = Database["public"]["Tables"]["votes"]["Row"] & { elections: Election };

interface DashboardParticipatedProps {
  userId: string;
}

export function DashboardParticipated({ userId }: DashboardParticipatedProps) {
  const [votedElections, setVotedElections] = useState<Vote[]>([]);
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
        .from("votes")
        .select("*, elections(*)")
        .eq("voter_identifier", userId)
        .order("voted_at", { ascending: false });

      if (error) throw error;
      setVotedElections((data || []) as Vote[]);
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
          {votedElections.map((vote) => {
            const election = vote.elections as Election;
            return (
              <Card 
                key={vote.id}
                className="group border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/40 backdrop-blur-sm overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {election.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Voted on {new Date(vote.voted_at).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm">
                      <p className="text-sm text-muted-foreground mb-1">Your vote:</p>
                      <p className="font-semibold text-lg text-primary">{vote.vote_value}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/vote/${vote.election_id}`)}
                      className="w-full sm:w-auto bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:from-primary/20 hover:to-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Election
                    </Button>
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
