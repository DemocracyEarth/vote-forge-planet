import { Home, Vote, PlusCircle, History, User, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const navItems = [
    {
      title: t('dashboard.publicFeed'),
      url: "/dashboard",
      icon: Home,
    },
    {
      title: t('dashboard.myElections'),
      url: "/dashboard/my-elections",
      icon: Vote,
    },
    {
      title: t('dashboard.participated'),
      url: "/dashboard/participated",
      icon: History,
    },
    {
      title: "Community",
      url: "/dashboard/community",
      icon: Users,
    },
    {
      title: t('dashboard.profile'),
      url: "/dashboard/profile",
      icon: User,
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({
      title: t('dashboard.signOut'),
      description: "You have been signed out successfully.",
    });
  };

  const handleCreateElection = () => {
    navigate("/?wizard=true");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-primary/10 bg-gradient-to-b from-background via-background to-primary/5">
      <SidebarHeader className="border-b border-primary/20 backdrop-blur-xl bg-background/60">
        <div className={`flex items-center gap-2 p-3 ${state === "collapsed" ? "justify-center" : ""}`}>
          {state !== "collapsed" && (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img src={logo} alt="Democracy Earth" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Democracy Earth
                </span>
                <span className="text-[10px] text-muted-foreground/50 -mt-1">
                  {t('beta.version', 'beta version')}
                </span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 mb-2">
            {t('dashboard.navigation') || 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={location.pathname === item.url}
                    tooltip={state === "collapsed" ? item.title : undefined}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      location.pathname === item.url 
                        ? "bg-gradient-to-r from-primary/20 to-primary/10 border-l-2 border-primary text-primary shadow-md" 
                        : "hover:bg-primary/5 hover:border-l-2 hover:border-primary/50"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 transition-transform duration-300 ${
                      location.pathname === item.url ? "scale-110" : "group-hover:scale-110"
                    }`} />
                    {state !== "collapsed" && (
                      <span className="font-medium">{item.title}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-primary/20 p-3 space-y-2 backdrop-blur-xl bg-background/60">
        <Button
          variant="outline"
          className="w-full justify-start bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 hover:from-primary hover:to-primary/90 hover:brightness-110 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          onClick={handleCreateElection}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {state !== "collapsed" && t('dashboard.createElection')}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {state !== "collapsed" && t('dashboard.signOut')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
