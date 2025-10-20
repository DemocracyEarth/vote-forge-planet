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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Public Elections</h2>
        <Badge variant="outline">{elections.length} Active</Badge>
      </div>

      {elections.map((election) => (
        <Card key={election.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {election.title}
                  {election.isEligible ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
                <CardDescription className="mt-2">
                  {election.description}
                </CardDescription>
              </div>
              <Badge variant={election.isEligible ? "default" : "secondary"}>
                {election.isEligible ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!election.isEligible && election.eligibilityReason && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <strong>Eligibility requirement:</strong> {election.eligibilityReason}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {election.start_date && (
                  <span>Started: {new Date(election.start_date).toLocaleDateString()}</span>
                )}
                {election.end_date && (
                  <span>• Ends: {new Date(election.end_date).toLocaleDateString()}</span>
                )}
              </div>

              <Button
                variant={election.isEligible ? "default" : "outline"}
                size="sm"
                onClick={() => navigate(`/vote/${election.id}`)}
                className="w-full sm:w-auto"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {election.isEligible ? "Vote Now" : "View Details"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
