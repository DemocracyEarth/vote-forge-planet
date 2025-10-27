import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCheck, UserX, Shield, Users, CheckCircle2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  delegation_count: number;
  is_verified: boolean;
  is_delegated_by_me: boolean;
}

export function DashboardUsersFeed() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myDelegation, setMyDelegation] = useState<{ id: string; delegate_id: string } | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get current user's delegation
      const { data: delegationData } = await supabase
        .from("delegations")
        .select("id, delegate_id")
        .eq("delegator_id", user.id)
        .eq("active", true)
        .maybeSingle();
      
      setMyDelegation(delegationData);

      // Get all users with their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, created_at")
        .neq("id", user.id)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get delegation counts for all users
      const { data: delegations, error: delegationsError } = await supabase
        .from("delegations")
        .select("delegate_id")
        .eq("active", true);

      if (delegationsError) throw delegationsError;

      // Count delegations per user
      const delegationCounts = delegations.reduce((acc, d) => {
        acc[d.delegate_id] = (acc[d.delegate_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Note: Verification status would need to be stored in profiles table
      // or fetched via a server-side function for accurate display
      const verificationMap: Record<string, boolean> = {};

      // Combine all data
      const usersWithData: UserProfile[] = (profiles || []).map(profile => ({
        ...profile,
        delegation_count: delegationCounts[profile.id] || 0,
        is_verified: verificationMap[profile.id] || false,
        is_delegated_by_me: delegationData?.delegate_id === profile.id
      }));

      setUsers(usersWithData);
      setFilteredUsers(usersWithData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.full_name?.toLowerCase().includes(query) ||
      user.bio?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const delegatedUsers = filteredUsers.filter(user => user.is_delegated_by_me);
  const otherUsers = filteredUsers.filter(user => !user.is_delegated_by_me);

  const handleDelegate = async (delegateId: string) => {
    if (!currentUserId) return;

    try {
      if (myDelegation?.delegate_id === delegateId) {
        // Revoke delegation
        const { error } = await supabase
          .from("delegations")
          .update({ active: false })
          .eq("id", myDelegation.id);

        if (error) throw error;

        toast({
          title: "Delegation revoked",
          description: "You have revoked your vote delegation",
        });
        
        setMyDelegation(null);
      } else {
        // Create or update delegation (upsert to handle re-delegation)
        if (myDelegation) {
          // Update existing active delegation to point to new delegate
          const { error } = await supabase
            .from("delegations")
            .update({ delegate_id: delegateId, active: true })
            .eq("id", myDelegation.id);

          if (error) throw error;
        } else {
          // Upsert delegation (creates new or reactivates existing)
          const { data, error } = await supabase
            .from("delegations")
            .upsert({
              delegator_id: currentUserId,
              delegate_id: delegateId,
              active: true
            }, {
              onConflict: 'delegator_id,delegate_id'
            })
            .select()
            .single();

          if (error) throw error;
          setMyDelegation(data);
        }

        toast({
          title: "Delegation updated",
          description: "You are now delegating your vote",
        });
      }

      await loadUsers();
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
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Community Members
          </h1>
          <p className="text-muted-foreground">
            Discover and delegate to trusted community members
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Community Members
        </h1>
        <p className="text-muted-foreground">
          Discover and delegate to trusted community members
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass-card"
        />
      </div>

      {delegatedUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <h2 className="text-2xl font-semibold">My Delegates</h2>
            <Badge variant="secondary" className="ml-2">{delegatedUsers.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {delegatedUsers.map((user) => (
              <Card 
                key={user.id} 
                className="glass-card border-primary/50 bg-primary/5 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300"
              >
                <CardHeader>
                  <Link to={`/dashboard/user/${user.id}`} className="block">
                    <div className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-primary/50 group-hover:border-primary transition-colors">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
                          <AvatarFallback className="text-lg">
                            {user.full_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <Star className="absolute -top-1 -right-1 h-5 w-5 fill-primary text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                            {user.full_name || "Anonymous"}
                          </CardTitle>
                          {user.is_verified && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{user.delegation_count} delegator{user.delegation_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {user.bio}
                    </p>
                  )}
                  <Button
                    onClick={() => handleDelegate(user.id)}
                    variant="outline"
                    className="w-full"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Revoke Delegation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">All Members</h2>
            <Badge variant="secondary" className="ml-2">{otherUsers.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherUsers.map((user) => (
              <Card 
                key={user.id} 
                className="glass-card hover:border-primary/50 transition-all duration-300"
              >
                <CardHeader>
                  <Link to={`/dashboard/user/${user.id}`} className="block">
                    <div className="flex items-start gap-4 cursor-pointer group">
                      <Avatar className="h-16 w-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
                        <AvatarFallback className="text-lg">
                          {user.full_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                            {user.full_name || "Anonymous"}
                          </CardTitle>
                          {user.is_verified && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{user.delegation_count} delegator{user.delegation_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {user.bio}
                    </p>
                  )}
                  <Button
                    onClick={() => handleDelegate(user.id)}
                    variant="default"
                    className="w-full"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Delegate Vote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? "No users found matching your search" : "No community members yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
