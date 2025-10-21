import { Home, Vote, PlusCircle, History } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

const navItems = [
  {
    title: "Public Feed",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "My Elections",
    url: "/dashboard/my-elections",
    icon: Vote,
  },
  {
    title: "Participated",
    url: "/dashboard/participated",
    icon: History,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const handleCreateElection = () => {
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-primary/10 bg-gradient-to-b from-background via-background to-primary/5">
      <SidebarHeader className="border-b border-primary/20 backdrop-blur-xl bg-background/60">
        <div className={`flex items-center gap-2 p-3 ${state === "collapsed" ? "justify-center" : ""}`}>
          {state !== "collapsed" && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Vote className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Democracy Earth
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 mb-2">
            Navigation
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
          className="w-full justify-start bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          onClick={handleCreateElection}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {state !== "collapsed" && "Create Election"}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {state !== "collapsed" && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
