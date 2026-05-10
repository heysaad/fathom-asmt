"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  TerminalSquareIcon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  ShipIcon,
  ShieldUserIcon,
  ShipWheelIcon,
  HomeIcon,
  FlameIcon,
  ListTodoIcon,
} from "lucide-react";
import { config } from "@/app/lib/config";
import { useUser } from "@/app/lib/user-context";
import { getAvatarUrl } from "@/app/lib/helpers";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <HomeIcon />,
    },
    {
      title: "Ships",
      url: "/ships",
      icon: <ShipWheelIcon />,
    },
    {
      title: "My Task",
      url: "/tasks",
      icon: <ListTodoIcon />,
    },
    {
      title: "My Drills",
      url: "/drills",
      icon: <FlameIcon />,
    },
    {
      title: "All Tasks",
      url: "/admin/tasks",
      icon: <ListTodoIcon />,
      adminOnly: true,
    },
    {
      title: "All Drills",
      url: "/admin/drills",
      icon: <FlameIcon />,
      adminOnly: true,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: <ShieldUserIcon />,
      adminOnly: true,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <FrameIcon />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <PieChartIcon />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <MapIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  const currentUser = user
    ? {
        name: user.name || user.email.split("@")[0],
        email: user.email,
        avatar: getAvatarUrl(user.name ?? user.email),
      }
    : data.user;
  const navItems = data.navMain.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <ShipIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Fathom Marine</p>
            <p className="text-xs text-slate-500">v{config.version}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
