"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";

interface CsvTypeStepProps {
  onNext: (type: "properties" | "tenants") => void;
}

export function CsvTypeStep({ onNext }: CsvTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-prussian-blue-500">
          What would you like to import?
        </h2>
        <p className="text-muted-foreground">
          Choose the type of data you want to import from CSV
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNext("properties")}
        >
          <CardHeader>
            <CardTitle className="text-prussian-blue-500 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Import property information including landlord details, addresses,
              and contact information.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Property names and billing names</p>
              <p>• Landlord information</p>
              <p>• Property addresses and contact details</p>
              <p>• Ward and block information</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNext("tenants")}
        >
          <CardHeader>
            <CardTitle className="text-prussian-blue-500 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Import tenant information including personal details, rent
              factors, and property assignments.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Tenant personal information</p>
              <p>• Property assignments</p>
              <p>• Rent structure and factors</p>
              <p>• Contact and communication preferences</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
