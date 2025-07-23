"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface CsvProgressStepProps {
  type: "properties" | "tenants";
  file: File;
  onBack: () => void;
  onReset: () => void;
}

interface ImportResult {
  ok?: boolean;
  imported?: number;
  skipped?: number;
  errors?: string[];
  message?: string;
}

export function CsvProgressStep({
  type,
  file,
  onBack,
  onReset,
}: CsvProgressStepProps) {
  const [status, setStatus] = useState<
    "uploading" | "processing" | "completed" | "error"
  >("uploading");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    const uploadFile = async () => {
      try {
        const workerUrl =
          process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
        setStatus("uploading");
        setProgress(0);
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);
        const formData = new FormData();
        formData.append("type", type);
        formData.append("file", file);
        setStatus("processing");
        const response = await fetch(`${workerUrl}/api/settings/import-csv`, {
          method: "POST",
          body: formData,
        });
        clearInterval(progressInterval);
        setProgress(100);
        const data = await response.json();
        setResult(data as ImportResult);
        setStatus((data as ImportResult).ok ? "completed" : "error");
      } catch (error) {
        setResult({
          ok: false,
          imported: 0,
          skipped: 0,
          errors: [
            error instanceof Error ? error.message : "Unknown error occurred",
          ],
          message: "Import failed",
        });
        setStatus("error");
      }
    };
    uploadFile();
  }, [type, file]);

  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
      case "processing":
        return (
          <RefreshCw className="h-8 w-8 animate-spin text-prussian-blue-500" />
        );
      case "completed":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "error":
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "uploading":
        return "Uploading file...";
      case "processing":
        return "Processing data...";
      case "completed":
        return "Import completed successfully!";
      case "error":
        return "Import failed";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "uploading":
      case "processing":
        return "text-prussian-blue-500";
      case "completed":
        return "text-green-500";
      case "error":
        return "text-red-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={status === "uploading" || status === "processing"}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-prussian-blue-500">
            Import Progress
          </h2>
          <p className="text-muted-foreground">
            {status === "uploading" || status === "processing"
              ? "Please wait while we process your data"
              : "Import process completed"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500">
              Import Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              {getStatusIcon()}
              <h3 className={`text-lg font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {result && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Imported:</span>
                  <Badge variant="outline" className="text-green-600">
                    {result.imported}{" "}
                    {type === "properties" ? "properties" : "tenants"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skipped:</span>
                  <Badge variant="outline" className="text-yellow-600">
                    {result.skipped} rows
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* File Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500">
              File Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">File Name:</span>
              <span className="font-medium">{file.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">File Size:</span>
              <span className="font-medium">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Import Type:</span>
              <Badge variant="outline" className="capitalize">
                {type}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Error Details */}
      {result?.errors && result.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Import Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600 space-y-1">
              {result.errors.map((err, idx) => (
                <div key={idx}>• {err}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onReset}>
          Start New Import
        </Button>
      </div>
    </div>
  );
}
