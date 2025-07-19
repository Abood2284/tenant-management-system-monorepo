"use client";

import { useState } from "react";
import { CsvTypeStep } from "@/app/dashboard/settings/components/CsvTypeStep";
import { CsvUploadStep } from "@/app/dashboard/settings/components/CsvUploadStep";
import { CsvPreviewStep } from "./CsvPreviewStep";
import { CsvProgressStep } from "./CsvProgressStep";

export type Step = "type" | "upload" | "preview" | "progress";
export type ImportType = "properties" | "tenants";

export function ImportCsvWizard() {
  const [step, setStep] = useState<Step>("type");
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleTypeSelect = (type: ImportType) => {
    console.log("Type selected:", type);
    setImportType(type);
    setStep("upload");
  };

  const handleFileUpload = (uploadedFile: File) => {
    console.log("File uploaded:", uploadedFile);
    setFile(uploadedFile);
    setStep("preview");
  };

  const handlePreviewConfirm = () => {
    console.log("Preview confirmed");
    setStep("progress");
  };

  const handleBack = () => {
    console.log("Back button clicked");
    switch (step) {
      case "upload":
        setStep("type");
        setImportType(null);
        break;
      case "preview":
        setStep("upload");
        setFile(null);
        break;
      case "progress":
        setStep("preview");
        break;
    }
  };

  const handleReset = () => {
    setStep("type");
    setImportType(null);
    setFile(null);
  };

  switch (step) {
    case "type":
      return <CsvTypeStep onNext={handleTypeSelect} />;
    case "upload":
      return (
        <CsvUploadStep
          type={importType!}
          onNext={handleFileUpload}
          onBack={handleBack}
        />
      );
    case "preview":
      return (
        <CsvPreviewStep
          type={importType!}
          file={file!}
          onNext={handlePreviewConfirm}
          onBack={handleBack}
        />
      );
    case "progress":
      return (
        <CsvProgressStep
          type={importType!}
          file={file!}
          onBack={handleBack}
          onReset={handleReset}
        />
      );
  }
}
