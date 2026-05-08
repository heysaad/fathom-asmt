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
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  ShipIcon,
  UserCogIcon,
  ShieldUserIcon,
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
      title: "Modules",
      url: "#",
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        {
          title: "Ships",
          url: "/ships",
        },
      ],
    },
    {
      title: "Admin",
      url: "#",
      icon: <ShieldUserIcon />,
      items: [
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Crew Members",
          url: "/admin/crew",
        },
      ],
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
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
