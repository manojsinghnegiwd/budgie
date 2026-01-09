"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, X, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import {
  analyzeMultipleReceiptImages,
  type ReceiptAnalysisResult,
  type MultiImageReceiptData,
} from "@/app/actions/receipt";
import { useCurrency } from "@/components/currency-provider";

interface ReceiptScannerProps {
  onExtracted: (data: ReceiptAnalysisResult) => void;
}

interface ImagePreview {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

export function ReceiptScanner({ onExtracted }: ReceiptScannerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatCurrencyAmount, currency } = useCurrency();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    
    const newPreviews: ImagePreview[] = [];
    
    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select only image files");
        continue;
      }

      // Validate file size (max 10MB per image)
      if (file.size > 10 * 1024 * 1024) {
        setError("Each image must be less than 10MB");
        continue;
      }

      try {
        const { dataUrl, base64 } = await fileToBase64(file);
        newPreviews.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          dataUrl,
          base64,
          mimeType: file.type,
        });
      } catch (err) {
        console.error("Error processing file:", err);
      }
    }
    
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<{ dataUrl: string; base64: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve({ dataUrl, base64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id: string) => {
    setPreviews(prev => prev.filter(p => p.id !== id));
  };

  const handleAnalyze = async () => {
    if (previews.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const images: MultiImageReceiptData[] = previews.map(p => ({
        base64: p.base64,
        mimeType: p.mimeType,
      }));
      
      const analysisResult = await analyzeMultipleReceiptImages(images, currency);
      setResult(analysisResult);
      onExtracted(analysisResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze receipt. Please try again or enter manually."
      );
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPreviews([]);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.removeAttribute("multiple");
      fileInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.setAttribute("multiple", "true");
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isAnalyzing}
      />

      {previews.length > 0 ? (
        <div className="space-y-3">
          {/* Image grid */}
          <div className="grid grid-cols-2 gap-2">
            {previews.map((preview) => (
              <div key={preview.id} className="relative">
                <img
                  src={preview.dataUrl}
                  alt="Receipt preview"
                  className="h-32 w-full object-cover rounded-lg border"
                />
                {!isAnalyzing && !result && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => handleRemoveImage(preview.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            
            {/* Add more images button */}
            {!isAnalyzing && !result && (
              <button
                type="button"
                onClick={handleUploadClick}
                className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-6 w-6 mb-1" />
                <span className="text-xs">Add More</span>
              </button>
            )}
          </div>

          {/* Image count indicator */}
          {!result && (
            <p className="text-sm text-muted-foreground text-center">
              {previews.length} image{previews.length !== 1 ? 's' : ''} selected
              {previews.length > 1 && " (will be treated as one order)"}
            </p>
          )}

          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mt-2 text-sm font-medium">
                Analyzing {previews.length} image{previews.length !== 1 ? 's' : ''}...
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                This may take a few seconds
              </span>
            </div>
          )}

          {/* Success result display */}
          {result && !isAnalyzing && (
            <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Receipt analyzed successfully!</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 ml-7">
                {result.merchant && (
                  <div>
                    <span className="font-medium">Merchant:</span> {result.merchant}
                  </div>
                )}
                {result.subtotal && result.subtotal !== result.amount && (
                  <div>
                    <span className="font-medium">Subtotal:</span> {formatCurrencyAmount(result.subtotal)}
                  </div>
                )}
                {result.discounts && result.discounts.length > 0 && (
                  <div>
                    <span className="font-medium">Discounts:</span>
                    <ul className="ml-4 mt-1">
                      {result.discounts.map((discount, idx) => (
                        <li key={idx}>
                          {discount.name}: -{formatCurrencyAmount(discount.amount)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.tax && (
                  <div>
                    <span className="font-medium">Tax:</span> {formatCurrencyAmount(result.tax)}
                  </div>
                )}
                <div className={result.totalSavings ? "font-semibold text-green-700 dark:text-green-400" : ""}>
                  <span className="font-medium">Final Total:</span> {formatCurrencyAmount(result.amount)}
                  {result.totalSavings && result.totalSavings > 0 && (
                    <span className="ml-2 text-xs">
                      (saved {formatCurrencyAmount(result.totalSavings)})
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Category:</span>{" "}
                  {result.suggestedCategoryName || "Not detected"}
                </div>
                <div>
                  <span className="font-medium">Confidence:</span>{" "}
                  {(result.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <p className="text-sm text-muted-foreground ml-7 mt-2">
                The form below has been pre-filled. Review and adjust as needed.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!result && !isAnalyzing && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                Clear All
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleAnalyze}
              >
                Analyze Receipt{previews.length > 1 ? 's' : ''}
              </Button>
            </div>
          )}
          
          {result && !isAnalyzing && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleReset}
            >
              Scan New Receipt
            </Button>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
          <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Scan Receipt</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Take photos or upload images of your receipt.
            <br />
            <span className="text-primary font-medium">Multiple images = one expense</span>
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-destructive/90 ml-7 mt-1">{error}</p>
        </div>
      )}

      {previews.length === 0 && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCameraClick}
            disabled={isAnalyzing}
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleUploadClick}
            disabled={isAnalyzing}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Images
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Supported formats: JPG, PNG, HEIC • Max size: 10MB per image
      </p>
    </div>
  );
}

