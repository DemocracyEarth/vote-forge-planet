import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Plus, ExternalLink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Election = Database["public"]["Tables"]["elections"]["Row"];
type Vote = Database["public"]["Tables"]["votes"]["Row"] & { elections: Election };

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myElections, setMyElections] = useState<Election[]>([]);
  const [votedElections, setVotedElections] = useState<Vote[]>([]);
  const [closedElections, setClosedElections] = useState<Election[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await loadDashboardData(session.user.id);
    setLoading(false);
  };

  const loadDashboardData = async (userId: string) => {
    // Load elections created by user
    const { data: created } = await supabase
      .from("elections")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (created) setMyElections(created);

    // Load elections where user voted
    const { data: voted } = await supabase
      .from("votes")
      .select("*, elections(*)")
      .eq("voter_identifier", userId)
      .order("voted_at", { ascending: false });

    if (voted) setVotedElections(voted as Vote[]);

    // Load closed elections
    const { data: closed } = await supabase
      .from("elections")
      .select("*")
      .eq("status", "closed")
      .order("end_date", { ascending: false });

    if (closed) setClosedElections(closed);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg">
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Election
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="created">My Elections ({myElections.length})</TabsTrigger>
            <TabsTrigger value="voted">Voted ({votedElections.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed Results ({closedElections.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="space-y-4">
            {myElections.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No elections created yet. Create your first election!
                </CardContent>
              </Card>
            ) : (
              myElections.map((election) => (
                <Card key={election.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{election.title}</CardTitle>
                        <CardDescription>{election.description}</CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        election.status === 'active' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 
                        'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                      }`}>
                        {election.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
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
          </TabsContent>

          <TabsContent value="voted" className="space-y-4">
            {votedElections.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  You haven't voted in any elections yet.
                </CardContent>
              </Card>
            ) : (
              votedElections.map((vote) => (
                <Card key={vote.id}>
                  <CardHeader>
                    <CardTitle>{(vote.elections as Election).title}</CardTitle>
                    <CardDescription>
                      Voted on {new Date(vote.voted_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
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
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-4">
            {closedElections.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No closed elections to display.
                </CardContent>
              </Card>
            ) : (
              closedElections.map((election) => (
                <Card key={election.id}>
                  <CardHeader>
                    <CardTitle>{election.title}</CardTitle>
                    <CardDescription>
                      Ended on {election.end_date ? new Date(election.end_date).toLocaleDateString() : 'N/A'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/vote/${election.id}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Results
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
