import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  Loader2, 
  Vote, 
  Trash2, 
  Share2, 
  Calendar, 
  Users, 
  BarChart3, 
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
              <Vote className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">No elections created yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first election to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {elections.map((election) => {
            const results = electionResults[election.id] || [];
            const totalVotes = results.length > 0 ? results[0].total_votes : 0;
            const identityConfig = election.identity_config as any;
            
            return (
              <Card 
                key={election.id}
                className="group border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/40 backdrop-blur-sm overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                          {election.title}
                        </CardTitle>
                        {election.is_ongoing && (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 font-semibold">
                            ● Live
                          </Badge>
                        )}
                        {election.is_public && (
                          <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400">
                            Public
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm leading-relaxed">
                        {truncateText(election.description, 120)}
                      </CardDescription>
                    </div>
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BarChart3 className="h-3 w-3" />
                        <span className="font-semibold">Current results:</span>
                        <span className="text-primary">{totalVotes} votes</span>
                      </div>
                      <div className="space-y-1.5">
                        {results.slice(0, 3).map((result) => {
                          if (!result.vote_value) return null;
                          const percentage = totalVotes > 0 
                            ? ((result.vote_count / totalVotes) * 100).toFixed(1)
                            : '0';
                          
                          return (
                            <div key={result.vote_value} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{result.vote_value}</span>
                                <span className="text-muted-foreground">{percentage}% ({result.vote_count})</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/vote/${election.id}`)}
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
