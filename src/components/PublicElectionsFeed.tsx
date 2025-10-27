import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Loader2, ExternalLink, Users, TrendingUp, Mail, Phone, Chrome, Globe, MessageSquare, Share2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ElectionCountdown } from "@/components/ElectionCountdown";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  bill_config?: any;
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

interface ElectionCommentCount {
  election_id: string;
  comment_count: number;
}

type FilterType = "all" | "my-elections" | "participated";

export function PublicElectionsFeed() {
  const [elections, setElections] = useState<PublicElection[]>([]);
  const [electionResults, setElectionResults] = useState<Record<string, ElectionResults[]>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPublicElections();
  }, [filter]);

  const loadPublicElections = async () => {
    // Only show full loading on initial load
    if (initialLoading) {
      setInitialLoading(true);
    } else {
      setContentLoading(true);
    }
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      let query = supabase
        .from("elections")
        .select("id, title, description, start_date, end_date, is_ongoing, is_public, status, created_at, identity_config, voting_page_config, bill_config, created_by")
        .eq("status", "active");

      // Apply filters
      if (filter === "my-elections") {
        query = query.eq("created_by", session.user.id);
      } else if (filter === "participated") {
        // Get elections user has voted in
        const { data: voterRegistry } = await supabase
          .from("voter_registry")
          .select("election_id")
          .eq("voter_id", session.user.id);
        
        const electionIds = voterRegistry?.map(v => v.election_id) || [];
        if (electionIds.length === 0) {
          setElections([]);
          setInitialLoading(false);
          setContentLoading(false);
          return;
        }
        query = query.in("id", electionIds);
      } else {
        // All public elections
        query = query.eq("is_public", true);
      }

      const { data: publicElections, error } = await query.order("created_at", { ascending: false });

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

        // Load results and comment counts for each election
        const resultsPromises = publicElections.map(async (election) => {
          const { data } = await supabase.rpc('get_election_results', {
            election_uuid: election.id
          });
          return { electionId: election.id, results: data || [] };
        });

        const commentCountPromises = publicElections.map(async (election) => {
          const { count } = await supabase
            .from('discussion_comments')
            .select('*', { count: 'exact', head: true })
            .eq('election_id', election.id);
          return { electionId: election.id, count: count || 0 };
        });

        const [allResults, allCommentCounts] = await Promise.all([
          Promise.all(resultsPromises),
          Promise.all(commentCountPromises)
        ]);
        
        const resultsMap: Record<string, ElectionResults[]> = {};
        allResults.forEach(({ electionId, results }) => {
          resultsMap[electionId] = results;
        });
        setElectionResults(resultsMap);

        const countsMap: Record<string, number> = {};
        allCommentCounts.forEach(({ electionId, count }) => {
          countsMap[electionId] = count;
        });
        setCommentCounts(countsMap);
      }
    } catch (error) {
      console.error("Error loading public elections:", error);
    } finally {
      setInitialLoading(false);
      setContentLoading(false);
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

  const copyElectionLink = (electionId: string) => {
    const link = `${window.location.origin}/vote/${electionId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Election link copied to clipboard.",
    });
  };

  const shareToTwitter = (election: PublicElection) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    const text = `Vote on: ${election.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
  };

  const shareToFacebook = (election: PublicElection) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  const shareToLinkedIn = (election: PublicElection) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, '_blank');
  };

  const shareToWhatsApp = (election: PublicElection) => {
    const link = `${window.location.origin}/vote/${election.id}`;
    const text = `Vote on: ${election.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`, '_blank');
  };


  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderSkeletonCards = () => (
    <div className="grid gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-sm animate-pulse">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-primary/10 rounded-lg w-3/4" />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-primary/10 rounded-full" />
                  <div className="h-4 bg-primary/10 rounded w-32" />
                </div>
                <div className="h-4 bg-primary/10 rounded w-full" />
              </div>
              <div className="h-20 w-24 bg-primary/10 rounded-xl" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-primary/10 rounded w-1/2" />
            <div className="h-24 bg-primary/10 rounded-xl" />
            <div className="flex gap-3">
              <div className="h-10 bg-primary/10 rounded flex-1" />
              <div className="h-10 bg-primary/10 rounded w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-sm">
      <CardContent className="pt-12 pb-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mb-6 shadow-lg shadow-primary/20">
          <Globe className="h-10 w-10 text-primary" />
        </div>
        <p className="text-muted-foreground text-lg mb-2 font-semibold">
          {filter === "my-elections" ? "No elections created yet" : filter === "participated" ? "No participation history yet" : "No public elections available"}
        </p>
        <p className="text-sm text-muted-foreground/70">
          {filter === "my-elections" ? "Create your first election to get started" : filter === "participated" ? "Start voting to see your history here" : "Check back later for new decisions to participate in!"}
        </p>
      </CardContent>
    </Card>
  );

  const getFilterTitle = () => {
    switch (filter) {
      case "my-elections":
        return "My Elections";
      case "participated":
        return "Participated Elections";
      default:
        return "Public Elections";
    }
  };

  const getFilterDescription = () => {
    switch (filter) {
      case "my-elections":
        return "Elections you have created";
      case "participated":
        return "Elections you have voted in";
      default:
        return "Discover and participate in global democratic decisions";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {getFilterTitle()}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {getFilterDescription()}
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30">
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">{elections.length} Active</span>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="all">All Public</TabsTrigger>
          <TabsTrigger value="my-elections">My Elections</TabsTrigger>
          <TabsTrigger value="participated">Participated</TabsTrigger>
        </TabsList>
      </Tabs>

      {contentLoading ? renderSkeletonCards() : elections.length === 0 ? renderEmptyState() : (
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
                        <Avatar 
                          className="h-6 w-6 border border-primary/20 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/profile/${election.created_by}`)}
                        >
                          <AvatarImage src={election.profiles.avatar_url || undefined} alt={election.profiles.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {election.profiles.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          by <span 
                            className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/profile/${election.created_by}`)}
                          >
                            {election.profiles.full_name}
                          </span>
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
              
              <CardContent className="relative space-y-4">
                {/* Compact Countdown */}
                <div className="text-sm">
                  <ElectionCountdown 
                    startDate={election.start_date}
                    endDate={election.end_date}
                    isOngoing={election.is_ongoing}
                  />
                </div>

                {/* Winner Display for Closed Elections */}
                {(() => {
                  const isClosed = election.end_date && new Date(election.end_date) < new Date() && !election.is_ongoing;
                  if (!isClosed || results.length === 0) return null;

                  // Extract valid ballot options
                  const extractOptionText = (opt: any) => (typeof opt === 'string' ? opt : (opt?.name || opt?.label || opt?.text || ''));
                  const vp = election.voting_page_config || {};
                  const optionsFromElection = (vp.election?.ballotOptions || []).map(extractOptionText);
                  const optionsFromElectionConfig = (vp.electionConfig?.ballotOptions || []).map(extractOptionText);
                  const optionsFromBallot = (vp.ballot?.options || []).map(extractOptionText);
                  const optionsFromBill = (election.bill_config?.ballotOptions || []).map(extractOptionText);
                  
                  const validOptionStrings = Array.from(new Set([
                    ...optionsFromElection,
                    ...optionsFromElectionConfig,
                    ...optionsFromBallot,
                    ...optionsFromBill,
                  ]
                    .filter(Boolean)
                    .map((s: string) => s.trim())));
                  
                  const shouldFilter = validOptionStrings.length > 0;
                  const validResults = (shouldFilter
                    ? results.filter(result => result.vote_value && validOptionStrings.includes(String(result.vote_value).trim()))
                    : results);

                  if (validResults.length === 0) return null;

                  const winner = validResults.sort((a, b) => b.vote_count - a.vote_count)[0];
                  const totalValidVotes = validResults.reduce((sum, r) => sum + r.vote_count, 0);
                  const winnerPercentage = totalValidVotes > 0 ? (winner.vote_count / totalValidVotes) * 100 : 0;

                  return (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/40 font-semibold">
                          Winner
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{winner.vote_value}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{winner.vote_count}</span>
                          <span className="text-sm text-muted-foreground ml-2">({winnerPercentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Quick stats bar */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {election.identity_config?.authenticationType && (
                    <div className="flex items-center gap-1">
                      {getAuthMethodIcon(election.identity_config.authenticationType)}
                      <span>{getAuthMethodLabel(election.identity_config.authenticationType)}</span>
                    </div>
                  )}
                  {commentCounts[election.id] > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{commentCounts[election.id]}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    onClick={() => navigate(`/vote/${election.id}`)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Vote
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-background border-border hover:bg-muted hover:border-border transition-all duration-300"
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
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
