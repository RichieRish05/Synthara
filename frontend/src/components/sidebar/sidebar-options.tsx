"use client"

import { usePathname } from "next/navigation";
import { SidebarMenuItem, SidebarMenuButton, SidebarMenu} from "../ui/sidebar"; 
import { Home, Music} from "lucide-react"


export default function SidebarOptions() {
    const path = usePathname();

    // Menu items.
    let items = [
        {
            title: "Home",
            url: "/",
            icon: Home,
            active: false
        },
        {
            title: "Create",
            url: "/create",
            icon: Music,
            active: false
        },
    ] 

    items = items.map(item => ({
      ...item,
      active: item.url === path
    }))
 
    return (
      <>
        {items.map(item => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.active}   >
            <a href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
        </SidebarMenuButton>
        </SidebarMenuItem>
        ))}
      </>
    )
}