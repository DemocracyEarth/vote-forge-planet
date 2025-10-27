import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { Loader2, Search } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PublicElectionsFeed } from "@/components/PublicElectionsFeed";
import { DashboardProfile } from "@/components/DashboardProfile";
import { DashboardUsersFeed } from "@/components/DashboardUsersFeed";
import { DashboardDiscussions } from "@/components/DashboardDiscussions";
import { UserProfileView } from "@/components/UserProfileView";
import DashboardNotifications from "./DashboardNotifications";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { unreadCount, refetch } = useUnreadNotifications(user?.id);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full aurora-bg relative overflow-hidden">
        {/* Futuristic background effects */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        
        <AppSidebar />
        
        <SidebarInset className="flex-1 relative">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-primary/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 px-6 shadow-lg shadow-primary/5">
            <SidebarTrigger className="hover:bg-primary/10 transition-colors duration-300" />
            
            <Button 
              variant="outline" 
              className="hidden md:flex relative w-64 justify-start text-left"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">Search...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <NotificationsPanel unreadCount={unreadCount} onCountChange={refetch} />
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </header>
          
          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

          <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
            <div className="max-w-7xl mx-auto px-2 md:px-0">
              <Routes>
                <Route path="/" element={<PublicElectionsFeed />} />
                <Route path="/discussions" element={<DashboardDiscussions userId={user?.id} />} />
                <Route path="/community" element={<DashboardUsersFeed />} />
                <Route path="/user/:userId" element={<UserProfileView />} />
                <Route path="/profile" element={<DashboardProfile />} />
                <Route path="/notifications" element={<DashboardNotifications />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
