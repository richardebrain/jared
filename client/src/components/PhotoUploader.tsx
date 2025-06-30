import { Button } from '@/components/ui/button';
import { Camera, Upload, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefObject } from 'react';

interface PhotoUploaderProps {
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
  uploadedPhotoData: string | null;
  photos: string[];
  onAnalyze: () => void;
  pendingVoiceNote: string;
  fileInputRef: RefObject<HTMLInputElement>;
}

export default function PhotoUploader({
  onPhotoUpload,
  isAnalyzing,
  uploadedPhotoData,
  photos,
  onAnalyze,
  pendingVoiceNote,
  fileInputRef
}: PhotoUploaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onPhotoUpload}
          accept="image/*"
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="w-full"
          size="lg"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Photo
        </Button>
        <p className="text-sm text-blue-600 mt-2 text-center">
          📸 Step 1: Upload your photo, then click "Analyze Photo" below
        </p>
        <p className="text-xs text-gray-500 mt-1 text-center">
          💡 For automatic child detection, upload profile photos in child management first
        </p>
      </div>
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            ))}
          </div>
          {uploadedPhotoData && (
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Analyzing Photo...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Analyze Photo & Detect Children
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 