import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Election = Database["public"]["Tables"]["elections"]["Row"];

interface ElectionWithEligibility extends Election {
  isEligible: boolean;
  eligibilityReason?: string;
}

export function PublicElectionsFeed() {
  const [elections, setElections] = useState<ElectionWithEligibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
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

      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserProfile(profile);

      // Load public elections
      const { data: publicElections, error } = await supabase
        .from("elections")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check eligibility for each election
      const electionsWithEligibility = (publicElections || []).map((election) => {
        const { isEligible, reason } = checkEligibility(election, session.user, profile);
        return {
          ...election,
          isEligible,
          eligibilityReason: reason,
        };
      });

      setElections(electionsWithEligibility);
    } catch (error) {
      console.error("Error loading public elections:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = (
    election: Election,
    user: any,
    profile: any
  ): { isEligible: boolean; reason?: string } => {
    const config = election.identity_config as any;
    
    if (!config || !config.authenticationType) {
      return { isEligible: true };
    }

    const authType = config.authenticationType;

    // Check based on authentication type
    switch (authType) {
      case "email":
        if (!user.email) {
          return { isEligible: false, reason: "Email verification required" };
        }
        return { isEligible: true };

      case "phone":
        if (!user.phone) {
          return { isEligible: false, reason: "Phone verification required" };
        }
        return { isEligible: true };

      case "google":
        const isGoogleAuth = user.app_metadata?.provider === "google";
        if (!isGoogleAuth) {
          return { isEligible: false, reason: "Google authentication required" };
        }
        return { isEligible: true };

      case "worldid":
        // For World ID, we'd need to check if user has World ID verification
        // This is a placeholder - actual implementation would verify World ID
        return { isEligible: false, reason: "World ID verification required" };

      default:
        return { isEligible: true };
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
                  <CardTitle className="text-xl flex items-center gap-3 group-hover:text-primary transition-colors duration-300">
                    {election.title}
                    {election.isEligible ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {election.description}
                  </CardDescription>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-sm ${
                    election.isEligible 
                      ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30 shadow-lg shadow-green-500/20" 
                      : "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                  }`}
                >
                  {election.isEligible ? "Eligible" : "Not Eligible"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                {!election.isEligible && election.eligibilityReason && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 backdrop-blur-sm">
                    <p className="text-sm">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Eligibility requirement:</span>{" "}
                      <span className="text-muted-foreground">{election.eligibilityReason}</span>
                    </p>
                  </div>
                )}
                
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
                </div>

                <Button
                  variant={election.isEligible ? "default" : "outline"}
                  size="sm"
                  onClick={() => navigate(`/vote/${election.id}`)}
                  className={`w-full sm:w-auto transition-all duration-300 hover:scale-105 ${
                    election.isEligible 
                      ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl" 
                      : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:from-primary/20 hover:to-primary/10 hover:border-primary/50"
                  }`}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {election.isEligible ? "Vote Now" : "View Details"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
