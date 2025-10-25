import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PublicElectionsFeed } from "@/components/PublicElectionsFeed";
import { DashboardMyElections } from "@/components/DashboardMyElections";
import { DashboardParticipated } from "@/components/DashboardParticipated";
import { DashboardProfile } from "@/components/DashboardProfile";
import { DashboardUsersFeed } from "@/components/DashboardUsersFeed";
import { DashboardDiscussions } from "@/components/DashboardDiscussions";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-8 relative">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<PublicElectionsFeed />} />
                <Route path="/my-elections" element={<DashboardMyElections userId={user?.id} />} />
                <Route path="/participated" element={<DashboardParticipated userId={user?.id} />} />
                <Route path="/discussions" element={<DashboardDiscussions userId={user?.id} />} />
                <Route path="/community" element={<DashboardUsersFeed />} />
                <Route path="/profile" element={<DashboardProfile />} />
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
