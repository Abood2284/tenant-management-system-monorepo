"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { parse } from "csv-parse/sync";

interface CsvPreviewStepProps {
  type: "properties" | "tenants";
  file: File;
  onNext: () => void;
  onBack: () => void;
}

interface CsvRow {
  [key: string]: string | number | boolean | null;
}

export function CsvPreviewStep({
  type,
  file,
  onNext,
  onBack,
}: CsvPreviewStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const hasRun = useRef(false);

  useEffect(() => {
    const processFile = async () => {
      if (hasRun.current) return;
      try {
        const text = await file.text();
        const parsed = parse(text, {
          columns: true,
          skip_empty_lines: true,
        }) as CsvRow[];
        setCsvData(parsed);
        hasRun.current = true;
        setIsLoading(false);
        setErrors([]);
      } catch (err) {
        setCsvData([]);
        hasRun.current = false;
        setIsLoading(false);
        setErrors([
          `Failed to parse CSV file: ${err instanceof Error ? err.message : String(err)}`,
        ]);
      }
    };

    processFile();
  }, [file, type]);

  const previewRows = csvData.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-prussian_blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing CSV file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-prussian-blue-500">
            Preview Data
          </h2>
          <p className="text-muted-foreground">
            Review the data before importing
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* File Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500">
              File Summary
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
              <span className="text-muted-foreground">Total Rows:</span>
              <span className="font-medium">{csvData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline" className="capitalize">
                {type}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Validation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500">Validation</CardTitle>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Valid CSV file</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Validation errors found</span>
                </div>
                <ul className="text-sm text-red-600 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500">
              Import Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p>
                • Duplicate {type === "properties" ? "properties" : "tenants"}{" "}
                will be skipped
              </p>
              <p>• Invalid rows will be reported</p>
              <p>• Import progress will be shown</p>
              <p>• You can cancel during import</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      {errors.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500">
              Data Preview (First 5 rows)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(previewRows[0] || {}).map((header) => (
                      <th key={header} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map(
                        (
                          value: string | number | boolean | null,
                          cellIndex
                        ) => (
                          <td
                            key={cellIndex}
                            className="p-2 text-muted-foreground"
                          >
                            {String(value)}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={errors.length > 0}
          className="bg-prussian-blue-500 hover:bg-prussian-blue-600"
        >
          Start Import
        </Button>
      </div>
    </div>
  );
}
