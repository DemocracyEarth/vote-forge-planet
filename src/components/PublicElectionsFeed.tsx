import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Loader2, ExternalLink, Users, Calendar, TrendingUp, Mail, Phone, Chrome, Globe } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  created_by: string;
  identity_config?: any;
  voting_page_config?: any;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ElectionResults {
  vote_value: string;
  vote_count: number;
  total_votes: number;
}

export function PublicElectionsFeed() {
  const [elections, setElections] = useState<PublicElection[]>([]);
  const [electionResults, setElectionResults] = useState<Record<string, ElectionResults[]>>({});
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

      // Load public elections with identity_config and voting_page_config
      const { data: publicElections, error } = await supabase
        .from("elections")
        .select("id, title, description, start_date, end_date, is_ongoing, is_public, status, created_at, identity_config, voting_page_config, created_by")
        .eq("is_public", true)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch creator profiles for all elections
      if (publicElections && publicElections.length > 0) {
        const creatorIds = [...new Set(publicElections.map(e => e.created_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", creatorIds);
        
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const electionsWithProfiles = publicElections.map(election => ({
          ...election,
          profiles: profilesMap.get(election.created_by)
        }));
        
        setElections(electionsWithProfiles as PublicElection[]);

        // Load results for each election
        const resultsPromises = publicElections.map(async (election) => {
          const { data } = await supabase.rpc('get_election_results', {
            election_uuid: election.id
          });
          return { electionId: election.id, results: data || [] };
        });

        const allResults = await Promise.all(resultsPromises);
        const resultsMap: Record<string, ElectionResults[]> = {};
        allResults.forEach(({ electionId, results }) => {
          resultsMap[electionId] = results;
        });
        setElectionResults(resultsMap);
      }
    } catch (error) {
      console.error("Error loading public elections:", error);
    } finally {
      setLoading(false);
    }
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

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return "No description provided";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-sm">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mb-6 shadow-lg shadow-primary/20">
            <Globe className="h-10 w-10 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg mb-2 font-semibold">No public elections available</p>
          <p className="text-sm text-muted-foreground/70">Check back later for new decisions to participate in!</p>
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

      <div className="grid gap-6">
        {elections.map((election) => {
          const results = electionResults[election.id] || [];
          const totalVotes = results.length > 0 ? results[0].total_votes : 0;
          
          return (
            <Card 
              key={election.id} 
              className="group border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 hover:shadow-xl transition-all duration-300 hover:border-primary/40 backdrop-blur-sm overflow-hidden"
            >
              {/* Subtle glow on hover */}
              <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 -z-10" />
              
              <CardHeader className="relative pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300 mb-3">
                      {election.title}
                    </CardTitle>
                    {election.profiles && (
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6 border border-primary/20">
                          <AvatarImage src={election.profiles.avatar_url || undefined} alt={election.profiles.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {election.profiles.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          by <span className="font-semibold text-foreground">{election.profiles.full_name}</span>
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {election.is_ongoing && (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30 font-semibold">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                          Live
                        </Badge>
                      )}
                      <CardDescription className="text-sm leading-relaxed">
                        {truncateText(election.description, 120)}
                      </CardDescription>
                    </div>
                  </div>
                  {totalVotes > 0 && (
                    <div className="flex flex-col items-end gap-1 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-bold text-primary">{totalVotes}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Total Votes</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-5">
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
                    {election.identity_config?.authenticationType && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getAuthMethodIcon(election.identity_config.authenticationType)}
                        {getAuthMethodLabel(election.identity_config.authenticationType)}
                      </Badge>
                    )}
                    {election.identity_config?.restrictions?.allowedCountries && 
                     election.identity_config.restrictions.allowedCountries.length > 0 && (
                      election.identity_config.restrictions.allowedCountries.length === 1 ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>{getCountryFlag(election.identity_config.restrictions.allowedCountries[0])}</span>
                          {getCountryName(election.identity_config.restrictions.allowedCountries[0])}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {election.identity_config.restrictions.allowedCountries.length} countries
                        </Badge>
                      )
                    )}
                    {!election.identity_config?.restrictions?.allowedCountries && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Global
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Results Preview */}
                {totalVotes > 0 && (() => {
                  // Get valid ballot options from the election config
                  const validOptions = election.voting_page_config?.election?.ballotOptions?.map((opt: any) => opt.name) || [];
                  
                  // Filter results to only show valid ballot options
                  const validResults = results.filter(result => 
                    result.vote_value && validOptions.includes(result.vote_value)
                  );
                  
                  // Recalculate total votes from valid results only
                  const validTotalVotes = validResults.reduce((sum, r) => sum + r.vote_count, 0);
                  
                  if (validTotalVotes === 0) return null;
                  
                  return (
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
                        {validResults
                          .sort((a, b) => b.vote_count - a.vote_count)
                          .slice(0, 3)
                          .map((result, idx) => {
                            const percentage = validTotalVotes > 0 
                              ? (result.vote_count / validTotalVotes) * 100
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
                  );
                })()}

                <div className="pt-4 border-t border-border">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/vote/${election.id}`)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View & Vote
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
