"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Upload, FileText } from "lucide-react";
import Link from "next/link";

interface CsvUploadStepProps {
  type: "properties" | "tenants";
  onNext: (file: File) => void;
  onBack: () => void;
}

export function CsvUploadStep({ type, onNext, onBack }: CsvUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const sampleFile =
    type === "properties" ? "sample-properties.csv" : "sample-tenants.csv";
  const sampleFileUrl = `/sample-files/${sampleFile}`;

  const handleFileSelect = (selectedFile: File) => {
    if (
      selectedFile.type === "text/csv" ||
      selectedFile.name.endsWith(".csv")
    ) {
      setFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleContinue = () => {
    if (file) {
      console.log("Continue to preview with file:", file);
      onNext(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-prussian-blue-500">
            Upload {type === "properties" ? "Properties" : "Tenants"} CSV
          </h2>
          <p className="text-muted-foreground">
            Select your CSV file to import {type} data
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* File Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-prussian-blue-500 bg-prussian-blue-50"
                  : "border-gray-300 hover:border-prussian-blue-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {file ? file.name : "Drop your CSV file here"}
              </p>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("csv-upload")?.click()}
              >
                Choose File
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-green-800 font-medium">{file.name}</span>
                <span className="text-green-600 text-sm">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample File Download */}
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Sample File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Download the sample CSV file to understand the required format:
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">
                    Sample {type === "properties" ? "Properties" : "Tenants"}{" "}
                    CSV
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contains example data and column headers
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={sampleFileUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">CSV Requirements:</p>
              <p>• File size: Maximum 1 MB</p>
              <p>• Format: UTF-8 encoded CSV</p>
              <p>• Headers: Must match sample file exactly</p>
              <p>• Data: All required fields must be filled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!file}
          className="bg-prussian-blue-500 hover:bg-prussian-blue-600"
        >
          Continue to Preview
        </Button>
      </div>
    </div>
  );
}
