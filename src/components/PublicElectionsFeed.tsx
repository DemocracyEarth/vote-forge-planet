import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Loader2, ExternalLink, Users, Calendar, BarChart3, Mail, Phone, Chrome, Globe } from "lucide-react";

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
  identity_config?: {
    authenticationType: string;
    restrictions?: {
      restrictionType?: string;
      allowedCountries?: string[];
    };
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

      // Load public elections with identity_config
      const { data: publicElections, error } = await supabase
        .from("elections")
        .select("id, title, description, start_date, end_date, is_ongoing, is_public, status, created_at, identity_config")
        .eq("is_public", true)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setElections(publicElections as PublicElection[] || []);

      // Load results for each election
      if (publicElections && publicElections.length > 0) {
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
        {elections.map((election) => {
          const results = electionResults[election.id] || [];
          const totalVotes = results.length > 0 ? results[0].total_votes : 0;
          
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

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate(`/vote/${election.id}`)}
                  className="w-full transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View & Vote
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
