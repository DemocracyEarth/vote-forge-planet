import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ExternalLink, 
  Loader2, 
  Vote, 
  Trash2, 
  Share2, 
  Calendar, 
  Users, 
  TrendingUp, 
  Mail, 
  Phone, 
  Chrome, 
  Globe 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/integrations/supabase/types";

type Election = Database["public"]["Tables"]["elections"]["Row"];

interface ElectionResults {
  vote_value: string;
  vote_count: number;
  total_votes: number;
}

interface DashboardMyElectionsProps {
  userId: string;
}

export function DashboardMyElections({ userId }: DashboardMyElectionsProps) {
  const [elections, setElections] = useState<Election[]>([]);
  const [electionResults, setElectionResults] = useState<Record<string, ElectionResults[]>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadMyElections();
    }
  }, [userId]);

  const loadMyElections = async () => {
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();
      
      if (profileData) {
        setUserProfile(profileData);
      }

      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setElections(data || []);

      // Load results for each election
      if (data && data.length > 0) {
        const resultsPromises = data.map(async (election) => {
          const { data: results } = await supabase.rpc('get_election_results', {
            election_uuid: election.id
          });
          return { electionId: election.id, results: results || [] };
        });

        const allResults = await Promise.all(resultsPromises);
        const resultsMap: Record<string, ElectionResults[]> = {};
        allResults.forEach(({ electionId, results }) => {
          resultsMap[electionId] = results;
        });
        setElectionResults(resultsMap);
      }
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

  const deleteElection = async (electionId: string) => {
    setDeleting(electionId);
    try {
      const { error } = await supabase
        .from("elections")
        .delete()
        .eq("id", electionId);

      if (error) throw error;

      setElections(elections.filter(e => e.id !== electionId));
      toast({
        title: "Election deleted",
        description: "Your election has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting election:", error);
      toast({
        title: "Error",
        description: "Failed to delete election.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
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

  const getAuthMethodIcon = (authType: string) => {
    switch (authType) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'phone':
        return <Phone className="h-3 w-3" />;
      case 'google':
        return <Chrome className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getAuthMethodLabel = (authType: string) => {
    switch (authType) {
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone';
      case 'google':
        return 'Google';
      default:
        return 'World ID';
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const code = countryCode.toUpperCase();
    return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397));
  };

  const getCountryName = (countryCode: string) => {
    const countryNames: Record<string, string> = {
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'ES': 'Spain',
      'IT': 'Italy',
      'JP': 'Japan',
      'CN': 'China',
      'IN': 'India',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'RU': 'Russia',
      'KR': 'South Korea',
      'NL': 'Netherlands',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'PL': 'Poland',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'AT': 'Austria',
      'IE': 'Ireland',
      'NZ': 'New Zealand',
      'SG': 'Singapore',
      'ZA': 'South Africa',
      'AR': 'Argentina',
      'CL': 'Chile',
    };
    return countryNames[countryCode.toUpperCase()] || countryCode;
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return "No description provided";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
            My Elections
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor your created elections
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
          <span className="text-sm font-semibold text-primary">{elections.length} Total</span>
        </div>
      </div>

      {elections.length === 0 ? (
        <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mb-6 shadow-lg shadow-primary/20">
              <Vote className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-2 font-semibold">No elections created yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first election to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {elections.map((election) => {
            const results = electionResults[election.id] || [];
            const totalVotes = results.length > 0 ? results[0].total_votes : 0;
            const identityConfig = election.identity_config as any;
            
            return (
              <Card 
                key={election.id}
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
                      {userProfile && (
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="h-6 w-6 border border-primary/20">
                            <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {userProfile.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            by <span className="font-semibold text-foreground">{userProfile.full_name}</span>
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {election.is_ongoing && (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30 font-semibold">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                            Live
                          </Badge>
                        )}
                        {election.is_public && (
                          <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold">
                            Public
                          </Badge>
                        )}
                        <CardDescription className="text-sm leading-relaxed">
                          {truncateText(election.description, 120)}
                        </CardDescription>
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
                
                <CardContent className="relative space-y-4">
                  {/* Date Information */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <Calendar className="h-3 w-3" />
                      {election.start_date ? (
                        <span>Started: {new Date(election.start_date).toLocaleDateString()}</span>
                      ) : (
                        <span>No start date</span>
                      )}
                    </div>
                    {election.end_date ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Calendar className="h-3 w-3" />
                        <span>Ends: {new Date(election.end_date).toLocaleDateString()}</span>
                      </div>
                    ) : election.is_ongoing && (
                      <div className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <span>No end date</span>
                      </div>
                    )}
                  </div>

                  {/* Eligibility Information */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="font-semibold">Who can vote:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {identityConfig?.authenticationType && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getAuthMethodIcon(identityConfig.authenticationType)}
                          {getAuthMethodLabel(identityConfig.authenticationType)}
                        </Badge>
                      )}
                      {identityConfig?.restrictions?.allowedCountries && 
                       identityConfig.restrictions.allowedCountries.length > 0 && (
                        identityConfig.restrictions.allowedCountries.length === 1 ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <span>{getCountryFlag(identityConfig.restrictions.allowedCountries[0])}</span>
                            {getCountryName(identityConfig.restrictions.allowedCountries[0])}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {identityConfig.restrictions.allowedCountries.length} countries
                          </Badge>
                        )
                      )}
                      {!identityConfig?.restrictions?.allowedCountries && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Global
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Results Preview */}
                  {totalVotes > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-base">Live Results</p>
                          <p className="text-xs text-muted-foreground">Real-time voting statistics</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {results
                          .sort((a, b) => b.vote_count - a.vote_count)
                          .slice(0, 3)
                          .map((result, idx) => {
                            if (!result.vote_value) return null;
                            const percentage = totalVotes > 0 
                              ? (result.vote_count / totalVotes) * 100
                              : 0;
                            
                            return (
                              <div 
                                key={result.vote_value}
                                className="p-4 rounded-xl bg-muted/50 border border-muted hover:border-muted-foreground/20 transition-all duration-300"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {idx === 0 && (
                                      <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-semibold">
                                        Leading
                                      </Badge>
                                    )}
                                    <span className="font-semibold">{result.vote_value}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold">{result.vote_count}</span>
                                    <span className="text-sm font-semibold text-muted-foreground min-w-[3.5rem] text-right">
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
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
                      onClick={() => navigate(`/vote/${election.id}`)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Election
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
                        <DropdownMenuItem onClick={() => copyElectionLink(election.id)}>
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

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleting === election.id}
                          className="border-red-500/30 text-red-600 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300"
                        >
                          {deleting === election.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Election</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{election.title}"? This action cannot be undone and will permanently delete all votes and data associated with this election.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteElection(election.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
