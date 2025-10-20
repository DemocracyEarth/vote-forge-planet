import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2 } from "lucide-react";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Participated Elections</h2>
        <span className="text-sm text-muted-foreground">{votedElections.length} total</span>
      </div>

      {votedElections.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>You haven't voted in any elections yet.</p>
            <p className="text-sm mt-2">Browse the public feed to find elections to participate in!</p>
          </CardContent>
        </Card>
      ) : (
        votedElections.map((vote) => {
          const election = vote.elections as Election;
          return (
            <Card key={vote.id}>
              <CardHeader>
                <CardTitle>{election.title}</CardTitle>
                <CardDescription>
                  Voted on {new Date(vote.voted_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm bg-muted p-3 rounded-md">
                    Your vote: <span className="font-semibold">{vote.vote_value}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/vote/${vote.election_id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Election
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
