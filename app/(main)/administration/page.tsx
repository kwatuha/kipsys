"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Key, Settings } from "lucide-react"
import { UsersManagement } from "@/components/administration/users-management"
import { RolesManagement } from "@/components/administration/roles-management"
import { PrivilegesManagement } from "@/components/administration/privileges-management"
import { SystemConfiguration } from "@/components/administration/system-configuration"

export default function AdministrationPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Administration</h1>
        <p className="text-muted-foreground">
          Manage users, roles, privileges, and system configuration
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="privileges" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Privileges
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4 mt-4">
          <RolesManagement />
        </TabsContent>

        <TabsContent value="privileges" className="space-y-4 mt-4">
          <PrivilegesManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-4">
          <SystemConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  )
}

