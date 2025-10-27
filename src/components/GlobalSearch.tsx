import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Vote, User, Clock, CheckCircle2, XCircle, Users } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";

interface Election {
  id: string;
  title: string;
  description: string;
  tags: string[];
  is_ongoing: boolean;
  status: string;
  created_by: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  email: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [elections, setElections] = useState<Election[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setElections([]);
      setUsers([]);
    }
  }, [open]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setElections([]);
      setUsers([]);
      return;
    }

    performSearch(debouncedQuery);
  }, [debouncedQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Search elections
      const { data: electionsData } = await supabase
        .from('elections')
        .select('id, title, description, tags, is_ongoing, status, created_by')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .limit(5);

      // Search users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, email')
        .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', user?.id || '')
        .limit(5);

      setElections(electionsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectElection = (electionId: string) => {
    navigate(`/vote/${electionId}`);
    onOpenChange(false);
  };

  const handleSelectUser = (userId: string) => {
    navigate(`/dashboard/user/${userId}`);
    onOpenChange(false);
  };

  const getStatusIcon = (election: Election) => {
    if (election.is_ongoing) {
      return <Clock className="h-4 w-4 text-green-500" />;
    } else if (election.status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (election: Election) => {
    if (election.is_ongoing) return "Ongoing";
    if (election.status === 'completed') return "Ended";
    return "Upcoming";
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search elections or users..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isSearching ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            {debouncedQuery.length < 2 && (
              <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
            )}
            
            {debouncedQuery.length >= 2 && elections.length === 0 && users.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {elections.length > 0 && (
              <>
                <CommandGroup heading="Elections">
                  {elections.map((election) => (
                    <CommandItem
                      key={election.id}
                      value={election.id}
                      onSelect={() => handleSelectElection(election.id)}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                    >
                      <Vote className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{election.title}</p>
                          {getStatusIcon(election)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(election)}
                          </span>
                        </div>
                        {election.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {election.description.substring(0, 100)}
                          </p>
                        )}
                        {election.tags && election.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {election.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {t(`tags.${tag}`)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {users.length > 0 && <CommandSeparator />}
              </>
            )}

            {users.length > 0 && (
              <CommandGroup heading="Users">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleSelectUser(user.id)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.full_name}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      )}
                      {user.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
