import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, MessageSquare, Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Election {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: string;
  is_ongoing: boolean;
}

interface Participation {
  id: string;
  election_id: string;
  voted_at: string;
  election: {
    title: string;
    created_by: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  election_id: string;
  election: {
    title: string;
  };
}

export function UserProfileView() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [delegationCount, setDelegationCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myDelegation, setMyDelegation] = useState<any>(null);
  const [isDelegatedByMe, setIsDelegatedByMe] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load elections created by this user (only public ones)
      const { data: electionsData, error: electionsError } = await supabase
        .from("elections")
        .select("id, title, description, created_at, status, is_ongoing")
        .eq("created_by", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (electionsError) throw electionsError;
      setElections(electionsData || []);

      // Load participations (voter_registry)
      const { data: participationsData, error: participationsError } = await supabase
        .from("voter_registry")
        .select(`
          id,
          election_id,
          voted_at,
          election:elections!voter_registry_election_id_fkey(title, created_by)
        `)
        .eq("voter_id", userId)
        .order("voted_at", { ascending: false });

      if (participationsError) throw participationsError;
      setParticipations(participationsData as any || []);

      // Load comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("discussion_comments")
        .select(`
          id,
          content,
          created_at,
          election_id,
          election:elections!discussion_comments_election_id_fkey(title)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;
      setComments(commentsData as any || []);

      // Get delegation count
      const { data: delegations, error: delegationsError } = await supabase
        .from("delegations")
        .select("id")
        .eq("delegate_id", userId)
        .eq("active", true);

      if (delegationsError) throw delegationsError;
      setDelegationCount(delegations?.length || 0);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // If there's a current user, check their delegation
      if (user?.id) {
        const { data: delegation } = await supabase
          .from("delegations")
          .select("*")
          .eq("delegator_id", user.id)
          .eq("active", true)
          .maybeSingle();
        
        setMyDelegation(delegation);
        setIsDelegatedByMe(delegation?.delegate_id === userId);
      }

    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelegate = async () => {
    if (!currentUserId || !userId) return;
    
    // Prevent self-delegation
    if (currentUserId === userId) {
      toast({
        title: "Cannot delegate to yourself",
        description: "You cannot delegate your vote to your own account",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isDelegatedByMe) {
        // REVOKE: Delete the delegation
        const { error } = await supabase
          .from("delegations")
          .delete()
          .eq("id", myDelegation.id);

        if (error) throw error;

        toast({
          title: "Delegation revoked",
          description: `You are no longer delegating to ${profile?.full_name}`,
        });
        
        setMyDelegation(null);
        setIsDelegatedByMe(false);
      } else {
        // DELEGATE: Use UPSERT to handle both create and update cases
        // First, deactivate any existing delegations for this user
        if (myDelegation) {
          await supabase
            .from("delegations")
            .update({ active: false })
            .eq("id", myDelegation.id);
        }

        // Now create/update the delegation to the new delegate
        const { data, error } = await supabase
          .from("delegations")
          .upsert({
            delegator_id: currentUserId,
            delegate_id: userId,
            active: true
          }, {
            onConflict: 'delegator_id,delegate_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (error) throw error;
        setMyDelegation(data);

        toast({
          title: "Vote delegated",
          description: `You are now delegating your vote to ${profile?.full_name}`,
        });
        
        setIsDelegatedByMe(true);
      }

      // Reload to update delegation count
      await loadUserData();
    } catch (error) {
      console.error("Error managing delegation:", error);
      toast({
        title: "Error",
        description: "Failed to manage delegation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">User not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/community">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Community
        </Button>
      </Link>

      {/* Profile Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || "User"} />
              <AvatarFallback className="text-2xl">
                {profile.full_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {profile.full_name || "Anonymous User"}
                </h1>
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{delegationCount} delegator{delegationCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(profile.created_at), "MMM yyyy")}</span>
                </div>
              </div>
              {profile.bio && (
                <p className="text-muted-foreground mt-4">{profile.bio}</p>
              )}
              
              {/* Delegation Button */}
              {currentUserId && currentUserId !== userId && (
                <div className="mt-4">
                  <Button
                    onClick={handleDelegate}
                    variant={isDelegatedByMe ? "outline" : "default"}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {isDelegatedByMe ? "Revoke Delegation" : "Delegate Vote"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="elections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="elections">
            <FileText className="h-4 w-4 mr-2" />
            Elections ({elections.length})
          </TabsTrigger>
          <TabsTrigger value="participated">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Participated ({participations.length})
          </TabsTrigger>
          <TabsTrigger value="discussions">
            <MessageSquare className="h-4 w-4 mr-2" />
            Discussions ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elections" className="space-y-4 mt-6">
          {elections.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No elections created yet</p>
              </CardContent>
            </Card>
          ) : (
            elections.map((election) => (
              <Link key={election.id} to={`/vote/${election.id}`}>
                <Card className="glass-card hover:border-primary/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{election.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {election.description}
                        </CardDescription>
                      </div>
                      <Badge variant={election.is_ongoing ? "default" : "secondary"}>
                        {election.is_ongoing ? "Active" : election.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {format(new Date(election.created_at), "PPP")}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="participated" className="space-y-4 mt-6">
          {participations.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No participations yet</p>
              </CardContent>
            </Card>
          ) : (
            participations.map((participation) => (
              <Link key={participation.id} to={`/vote/${participation.election_id}`}>
                <Card className="glass-card hover:border-primary/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {participation.election.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          Voted on {format(new Date(participation.voted_at), "PPP 'at' p")}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Voted
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="discussions" className="space-y-4 mt-6">
          {comments.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No comments yet</p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <Link key={comment.id} to={`/vote/${comment.election_id}`}>
                <Card className="glass-card hover:border-primary/50 transition-all duration-300">
                  <CardHeader>
                    <CardDescription className="text-xs mb-2">
                      On: {comment.election.title}
                    </CardDescription>
                    <CardContent className="px-0 py-0">
                      <p className="text-sm line-clamp-3">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(comment.created_at), "PPP 'at' p")}
                      </p>
                    </CardContent>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
