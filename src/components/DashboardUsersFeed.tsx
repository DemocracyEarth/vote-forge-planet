import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, CheckCircle2, Star, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DelegateButton } from "@/components/DelegateButton";

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
        .select("delegate_id");

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
            Community Members
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover and delegate to trusted community members
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
          <span className="text-sm font-semibold text-primary">{filteredUsers.length} Members</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-primary/20 bg-background/50 backdrop-blur-sm"
        />
      </div>

      {delegatedUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
              <Star className="h-5 w-5 fill-primary text-primary" />
            </div>
            <h3 className="text-xl font-bold">My Delegates</h3>
            <Badge className="bg-primary/10 text-primary border border-primary/30">{delegatedUsers.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {delegatedUsers.map((user) => (
              <Card 
                key={user.id} 
                className="group border-primary/40 bg-gradient-to-br from-background via-primary/10 to-primary/5 hover:shadow-xl transition-all duration-300 hover:border-primary/50 backdrop-blur-sm overflow-hidden"
              >
                {/* Subtle glow on hover */}
                <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 -z-10" />
                
                <CardHeader className="relative pb-4">
                  <Link to={`/dashboard/user/${user.id}`} className="block">
                    <div className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-primary/50 group-hover:border-primary transition-colors shadow-lg">
                          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
                          <AvatarFallback className="text-lg bg-primary/10 text-primary">
                            {user.full_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/50 flex items-center justify-center">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                            {user.full_name || "Anonymous"}
                          </CardTitle>
                          {user.is_verified && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs w-fit">
                          <Users className="h-3 w-3 text-primary" />
                          <span className="text-primary font-semibold">{user.delegation_count} delegator{user.delegation_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                  <DelegateButton
                    delegateId={user.id}
                    delegateName={user.full_name || "this user"}
                    currentUserId={currentUserId!}
                    myDelegation={myDelegation}
                    onDelegationChange={(newDelegation) => {
                      setMyDelegation(newDelegation);
                      
                      // Update users list optimistically
                      setUsers(prevUsers => 
                        prevUsers.map(u => {
                          if (u.id === user.id) {
                            return { 
                              ...u, 
                              delegation_count: newDelegation ? u.delegation_count + 1 : Math.max(0, u.delegation_count - 1),
                              is_delegated_by_me: !!newDelegation 
                            };
                          }
                          if (u.id === myDelegation?.delegate_id) {
                            return { 
                              ...u, 
                              delegation_count: Math.max(0, u.delegation_count - 1),
                              is_delegated_by_me: false 
                            };
                          }
                          return u;
                        })
                      );
                    }}
                    variant="outline"
                    showIcon={true}
                    className="w-full border-red-500/30 text-red-600 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold">All Members</h3>
            <Badge className="bg-primary/10 text-primary border border-primary/30">{otherUsers.length}</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherUsers.map((user) => (
              <Card 
                key={user.id} 
                className="group border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 hover:shadow-xl transition-all duration-300 hover:border-primary/40 backdrop-blur-sm overflow-hidden"
              >
                {/* Subtle glow on hover */}
                <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 -z-10" />
                
                <CardHeader className="relative pb-4">
                  <Link to={`/dashboard/user/${user.id}`} className="block">
                    <div className="flex items-start gap-4 cursor-pointer group">
                      <Avatar className="h-16 w-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors shadow-lg">
                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {user.full_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                            {user.full_name || "Anonymous"}
                          </CardTitle>
                          {user.is_verified && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs w-fit">
                          <Users className="h-3 w-3 text-primary" />
                          <span className="text-primary font-semibold">{user.delegation_count} delegator{user.delegation_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                  <DelegateButton
                    delegateId={user.id}
                    delegateName={user.full_name || "this user"}
                    currentUserId={currentUserId!}
                    myDelegation={myDelegation}
                    onDelegationChange={(newDelegation) => {
                      setMyDelegation(newDelegation);
                      
                      // Update users list optimistically
                      setUsers(prevUsers => 
                        prevUsers.map(u => {
                          if (u.id === user.id) {
                            return { 
                              ...u, 
                              delegation_count: newDelegation ? u.delegation_count + 1 : Math.max(0, u.delegation_count - 1),
                              is_delegated_by_me: !!newDelegation 
                            };
                          }
                          if (u.id === myDelegation?.delegate_id) {
                            return { 
                              ...u, 
                              delegation_count: Math.max(0, u.delegation_count - 1),
                              is_delegated_by_me: false 
                            };
                          }
                          return u;
                        })
                      );
                    }}
                    variant="default"
                    showIcon={true}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mb-6 shadow-lg shadow-primary/20">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-2 font-semibold">
              {searchQuery ? "No users found matching your search" : "No community members yet"}
            </p>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery ? "Try adjusting your search terms" : "Community members will appear here"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
