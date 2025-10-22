import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, ExternalLink } from "lucide-react";

interface PublicElection {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean | null;
  is_public: boolean | null;
  status: string | null;
  created_at: string | null;
}

export function PublicElectionsFeed() {
  const [elections, setElections] = useState<PublicElection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublicElections();
  }, []);

  const loadPublicElections = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load public elections using secure view (excludes sensitive configs)
      const { data: publicElections, error } = await supabase
        .from("public_elections")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setElections(publicElections || []);
    } catch (error) {
      console.error("Error loading public elections:", error);
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

  if (elections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>No public elections available at the moment.</p>
          <p className="text-sm mt-2">Check back later for new decisions to participate in!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Public Elections
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover and participate in global democratic decisions
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30">
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">{elections.length} Active</span>
        </div>
      </div>

      <div className="grid gap-4">
        {elections.map((election) => (
          <Card 
            key={election.id} 
            className="group border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/40 backdrop-blur-sm overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {election.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {election.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 text-xs">
                  {election.start_date && (
                    <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Started: {new Date(election.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {election.end_date && (
                    <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Ends: {new Date(election.end_date).toLocaleDateString()}
                    </span>
                  )}
                  {election.is_ongoing && (
                    <span className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-semibold">
                      ● Live
                    </span>
                  )}
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate(`/vote/${election.id}`)}
                  className="w-full sm:w-auto transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View & Vote
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
