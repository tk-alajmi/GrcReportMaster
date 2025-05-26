import { useState } from "react";
import { Server, AlertTriangle, Shield, FileText } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { parseCSV, validateAssetCSV, validateThreatCSV, validateControlsCSV } from "@/lib/csv-parser";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVUploadProps {
  onDataImport?: (type: string, data: Record<string, string>[]) => void;
}

export function CSVUpload({ onDataImport }: CSVUploadProps) {
  const [uploadResults, setUploadResults] = useState<Record<string, { success: boolean; message: string; count?: number }>>({});

  const handleFileUpload = async (type: string, file: File) => {
    try {
      const text = await file.text();
      const parseResult = parseCSV(text);
      
      if (parseResult.errors.length > 0) {
        setUploadResults(prev => ({
          ...prev,
          [type]: { success: false, message: `Parse errors: ${parseResult.errors.join(', ')}` }
        }));
        return;
      }

      // Validate based on type
      let validation;
      switch (type) {
        case 'assets':
          validation = validateAssetCSV(parseResult.data);
          break;
        case 'threats':
          validation = validateThreatCSV(parseResult.data);
          break;
        case 'controls':
          validation = validateControlsCSV(parseResult.data);
          break;
        default:
          validation = { valid: true, errors: [] };
      }

      if (!validation.valid) {
        setUploadResults(prev => ({
          ...prev,
          [type]: { success: false, message: `Validation errors: ${validation.errors.join(', ')}` }
        }));
        return;
      }

      // Success
      setUploadResults(prev => ({
        ...prev,
        [type]: { success: true, message: 'Data imported successfully', count: parseResult.data.length }
      }));

      if (onDataImport) {
        onDataImport(type, parseResult.data);
      }
    } catch (error) {
      setUploadResults(prev => ({
        ...prev,
        [type]: { success: false, message: 'Failed to process file' }
      }));
    }
  };

  const uploadConfigs = [
    {
      type: 'assets',
      icon: Server,
      title: 'Asset Inventory',
      description: 'Upload asset list CSV',
      fields: 'Required: name, type, criticality'
    },
    {
      type: 'threats',
      icon: AlertTriangle,
      title: 'Threat Data',
      description: 'Upload threat intelligence',
      fields: 'Required: threat, likelihood (1-5), impact (1-5)'
    },
    {
      type: 'controls',
      icon: Shield,
      title: 'Controls',
      description: 'Upload existing controls',
      fields: 'Required: control, status (implemented/partial/not-implemented)'
    }
  ];

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Data Import (Optional)</h3>
      
      <Alert className="mb-4">
        <FileText className="w-4 h-4" />
        <AlertDescription>
          Upload CSV files with your asset inventory, threat data, or existing controls to speed up the risk assessment process.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {uploadConfigs.map(({ type, icon: Icon, title, description, fields }) => {
          const result = uploadResults[type];
          
          return (
            <div key={type} className="space-y-2">
              <div className="border border-gray-300 rounded-lg p-4 text-center">
                <Icon className="mx-auto w-6 h-6 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">{title}</p>
                <p className="text-xs text-gray-500 mb-2">{description}</p>
                <p className="text-xs text-gray-400 mb-3">{fields}</p>
                
                <FileUpload
                  accept=".csv"
                  maxSize={5 * 1024 * 1024} // 5MB
                  title="Select CSV file"
                  description="CSV files only"
                  onFileSelect={(file) => handleFileUpload(type, file)}
                  className="w-full"
                />
              </div>
              
              {result && (
                <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                    {result.message}
                    {result.count && ` (${result.count} records)`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
