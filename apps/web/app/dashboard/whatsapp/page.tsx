"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function WhatsAppPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Mock data
  const templates = [
    {
      id: "rent-reminder",
      name: "Rent Reminder",
      content:
        "Dear {tenant_name}, this is a friendly reminder that your rent of ₹{rent_amount} for {property_name} is due on {due_date}. Please make the payment at your earliest convenience.",
      type: "reminder",
    },
    {
      id: "overdue-notice",
      name: "Overdue Notice",
      content:
        "Dear {tenant_name}, your rent payment of ₹{rent_amount} for {property_name} is overdue by {days_overdue} days. Please settle this immediately to avoid penalty charges.",
      type: "warning",
    },
    {
      id: "payment-receipt",
      name: "Payment Receipt",
      content:
        "Dear {tenant_name}, we have received your payment of ₹{amount} for {property_name}. Thank you for your prompt payment. Receipt ID: {receipt_id}",
      type: "receipt",
    },
    {
      id: "welcome-message",
      name: "Welcome Message",
      content:
        "Welcome to {property_name}! We're glad to have you as our tenant. For any queries, please contact us at this number.",
      type: "welcome",
    },
  ];

  const messageHistory = [
    {
      id: 1,
      tenant: "John Smith",
      phone: "+91 9876543210",
      template: "Rent Reminder",
      sentAt: "2025-01-07 10:30 AM",
      status: "Delivered",
      response: "Acknowledged",
    },
    {
      id: 2,
      tenant: "Sarah Johnson",
      phone: "+91 9876543211",
      template: "Overdue Notice",
      sentAt: "2025-01-06 2:15 PM",
      status: "Read",
      response: "No Response",
    },
    {
      id: 3,
      tenant: "Mike Wilson",
      phone: "+91 9876543212",
      template: "Payment Receipt",
      sentAt: "2025-01-05 4:45 PM",
      status: "Delivered",
      response: "Thanked",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Read":
        return <Eye className="h-4 w-4 text-blue-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "bg-blue-100 text-blue-800";
      case "warning":
        return "bg-fire_brick-100 text-fire_brick-500";
      case "receipt":
        return "bg-green-100 text-green-800";
      case "welcome":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian_blue-500">
            WhatsApp Communication
          </h1>
          <p className="text-muted-foreground mt-2">
            Send automated messages and reminders to tenants
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Broadcast
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Messages Sent Today
                </p>
                <p className="text-2xl font-bold text-prussian_blue-500">24</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold text-prussian_blue-500">96%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold text-prussian_blue-500">42</p>
              </div>
              <Users className="h-8 w-8 text-air_superiority_blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-prussian_blue-500">78%</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500">
            Message Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-prussian_blue-500">
                    {template.name}
                  </h3>
                  <Badge className={getTemplateTypeColor(template.type)}>
                    {template.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {template.content}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-air_superiority_blue-500 border-air_superiority_blue-500"
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Send Message Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500">Send Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                Select Template
              </label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                Send To
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipients..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="overdue">Overdue Tenants</SelectItem>
                  <SelectItem value="specific">Specific Tenants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
              Message Preview
            </label>
            <Textarea
              placeholder="Message preview will appear here..."
              className="min-h-[100px]"
              readOnly
            />
          </div>

          <div className="flex gap-4">
            <Button className="bg-green-600 hover:bg-green-700 flex-1">
              <Send className="h-4 w-4 mr-2" />
              Send Messages
            </Button>
            <Button
              variant="outline"
              className="text-air_superiority_blue-500 border-air_superiority_blue-500"
            >
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500">
            Message History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messageHistory.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium text-prussian_blue-500">
                    {message.tenant}
                  </TableCell>
                  <TableCell>{message.phone}</TableCell>
                  <TableCell>{message.template}</TableCell>
                  <TableCell>{message.sentAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      <span>{message.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        message.response === "No Response"
                          ? "text-gray-600"
                          : "text-green-600"
                      }
                    >
                      {message.response}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default WhatsAppPage;
