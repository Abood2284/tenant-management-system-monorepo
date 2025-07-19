"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  User,
  Shield,
  Bell,
  Percent,
  Palette,
  Database,
  Key,
  Upload,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ImportCsvWizard } from "./components/ImportCsvWizard";

type SettingsTab =
  | "profile"
  | "security"
  | "billing"
  | "notifications"
  | "appearance"
  | "data"
  | "import-csv";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@tenantpro.com",
    phone: "+91 9876543210",
    company: "TenantPro Management",
  });

  const [systemSettings, setSystemSettings] = useState({
    defaultPenaltyPercent: 5,
    gracePeriodDays: 5,
    autoReminders: true,
    whatsappIntegration: true,
    emailNotifications: false,
    currency: "INR",
  });

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileSettings
            profileData={profileData}
            setProfileData={setProfileData}
          />
        );
      case "security":
        return <SecuritySettings />;
      case "billing":
        return (
          <BillingSettings
            systemSettings={systemSettings}
            setSystemSettings={setSystemSettings}
          />
        );
      case "notifications":
        return (
          <NotificationSettings
            systemSettings={systemSettings}
            setSystemSettings={setSystemSettings}
          />
        );
      case "appearance":
        return <AppearanceSettings />;
      case "data":
        return <DataSettings />;
      case "import-csv":
        return <ImportCsvWizard />;
      default:
        return (
          <ProfileSettings
            profileData={profileData}
            setProfileData={setProfileData}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian_blue-500">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile and system preferences
          </p>
        </div>
        {activeTab !== "import-csv" && (
          <Button className="bg-prussian_blue-500 hover:bg-prussian_blue-600">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-prussian_blue-500 text-lg">
                Settings Menu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={activeTab === "profile" ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setActiveTab("profile")}
              >
                <User className="h-4 w-4 mr-3" />
                Profile Settings
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setActiveTab("security")}
              >
                <Shield className="h-4 w-4 mr-3" />
                Security
              </Button>
              <Button
                variant={activeTab === "billing" ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setActiveTab("billing")}
              >
                <Percent className="h-4 w-4 mr-3" />
                Billing Settings
              </Button>
              <Button
                variant={activeTab === "notifications" ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="h-4 w-4 mr-3" />
                Notifications
              </Button>
              <Button
                variant={activeTab === "appearance" ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setActiveTab("appearance")}
              >
                <Palette className="h-4 w-4 mr-3" />
                Appearance
              </Button>
              <Button
                variant={activeTab === "data" ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setActiveTab("data")}
              >
                <Database className="h-4 w-4 mr-3" />
                Data & Backup
              </Button>
              <Button
                variant={activeTab === "import-csv" ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => setActiveTab("import-csv")}
              >
                <Upload className="h-4 w-4 mr-3" />
                Import CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2">
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Settings Component
function ProfileSettings({
  profileData,
  setProfileData,
}: {
  profileData: any;
  setProfileData: (data: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-prussian_blue-500">
              Full Name
            </Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) =>
                setProfileData((prev: any) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-prussian_blue-500">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData((prev: any) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-prussian_blue-500">
              Phone Number
            </Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) =>
                setProfileData((prev: any) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="company" className="text-prussian_blue-500">
              Company Name
            </Label>
            <Input
              id="company"
              value={profileData.company}
              onChange={(e) =>
                setProfileData((prev: any) => ({
                  ...prev,
                  company: e.target.value,
                }))
              }
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Security Settings Component
function SecuritySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="current-password" className="text-prussian_blue-500">
            Current Password
          </Label>
          <Input id="current-password" type="password" className="mt-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="new-password" className="text-prussian_blue-500">
              New Password
            </Label>
            <Input id="new-password" type="password" className="mt-1" />
          </div>
          <div>
            <Label
              htmlFor="confirm-password"
              className="text-prussian_blue-500"
            >
              Confirm Password
            </Label>
            <Input id="confirm-password" type="password" className="mt-1" />
          </div>
        </div>
        <Button className="bg-air_superiority_blue-500 hover:bg-air_superiority_blue-600">
          <Key className="h-4 w-4 mr-2" />
          Update Password
        </Button>
      </CardContent>
    </Card>
  );
}

// Billing Settings Component
function BillingSettings({
  systemSettings,
  setSystemSettings,
}: {
  systemSettings: any;
  setSystemSettings: (data: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Billing & System Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="penalty-percent" className="text-prussian_blue-500">
              Default Penalty Percentage
            </Label>
            <Input
              id="penalty-percent"
              type="number"
              value={systemSettings.defaultPenaltyPercent}
              onChange={(e) =>
                setSystemSettings((prev: any) => ({
                  ...prev,
                  defaultPenaltyPercent: parseInt(e.target.value),
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="grace-period" className="text-prussian_blue-500">
              Grace Period (Days)
            </Label>
            <Input
              id="grace-period"
              type="number"
              value={systemSettings.gracePeriodDays}
              onChange={(e) =>
                setSystemSettings((prev: any) => ({
                  ...prev,
                  gracePeriodDays: parseInt(e.target.value),
                }))
              }
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="currency" className="text-prussian_blue-500">
            Default Currency
          </Label>
          <Select
            value={systemSettings.currency}
            onValueChange={(value) =>
              setSystemSettings((prev: any) => ({ ...prev, currency: value }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// Notification Settings Component
function NotificationSettings({
  systemSettings,
  setSystemSettings,
}: {
  systemSettings: any;
  setSystemSettings: (data: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-prussian_blue-500">
              WhatsApp Integration
            </Label>
            <p className="text-sm text-muted-foreground">
              Send rent reminders via WhatsApp
            </p>
          </div>
          <Switch
            checked={systemSettings.whatsappIntegration}
            onCheckedChange={(checked) =>
              setSystemSettings((prev: any) => ({
                ...prev,
                whatsappIntegration: checked,
              }))
            }
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-prussian_blue-500">Auto Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Automatically send payment reminders
            </p>
          </div>
          <Switch
            checked={systemSettings.autoReminders}
            onCheckedChange={(checked) =>
              setSystemSettings((prev: any) => ({
                ...prev,
                autoReminders: checked,
              }))
            }
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-prussian_blue-500">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            checked={systemSettings.emailNotifications}
            onCheckedChange={(checked) =>
              setSystemSettings((prev: any) => ({
                ...prev,
                emailNotifications: checked,
              }))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Appearance Settings Component
function AppearanceSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Appearance settings will be available in future updates.
        </p>
      </CardContent>
    </Card>
  );
}

// Data Settings Component
function DataSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
          <Database className="h-5 w-5" />
          System Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Version</Label>
            <p className="font-medium text-prussian_blue-500">v1.0.0</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Last Backup</Label>
            <p className="font-medium text-prussian_blue-500">
              2025-01-07 10:30 AM
            </p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">
              Storage Used
            </Label>
            <p className="font-medium text-prussian_blue-500">2.4 GB</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">
              Active Users
            </Label>
            <p className="font-medium text-prussian_blue-500">1</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="text-air_superiority_blue-500 border-air_superiority_blue-500"
          >
            <Database className="h-4 w-4 mr-2" />
            Backup Data
          </Button>
          <Button
            variant="outline"
            className="text-fire_brick-500 border-fire_brick-500"
          >
            Reset Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SettingsPage;
