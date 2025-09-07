import SidebarOptions from "./sidebar-options";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarFooter
} from "../ui/sidebar";
import { UserButton } from "@daveyplate/better-auth-ui";





export function AppSidebar() {


  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary mt-4 mb-12 flex flex-col justify-start items-start px-2 text-3xl font-black tracking-widest uppercase">
            <p className="text-purple-700">Music</p>
            <p className="text-lg">Generator</p>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarOptions/>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserButton variant="outline" size="lg"/>
      </SidebarFooter>
    </Sidebar>
  )
}