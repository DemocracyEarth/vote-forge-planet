import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Election = Database["public"]["Tables"]["elections"]["Row"];

interface DashboardMyElectionsProps {
  userId: string;
}

export function DashboardMyElections({ userId }: DashboardMyElectionsProps) {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadMyElections();
    }
  }, [userId]);

  const loadMyElections = async () => {
    try {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error("Error loading elections:", error);
      toast({
        title: "Error",
        description: "Failed to load your elections.",
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
        <h2 className="text-2xl font-bold">My Elections</h2>
        <span className="text-sm text-muted-foreground">{elections.length} total</span>
      </div>

      {elections.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No elections created yet.</p>
            <p className="text-sm mt-2">Create your first election to get started!</p>
          </CardContent>
        </Card>
      ) : (
        elections.map((election) => (
          <Card key={election.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{election.title}</CardTitle>
                  <CardDescription className="mt-2">{election.description}</CardDescription>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                    election.status === "active"
                      ? "bg-green-500/20 text-green-700 dark:text-green-300"
                      : "bg-gray-500/20 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {election.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/vote/${election.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Election
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyElectionLink(election.id)}
                >
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
