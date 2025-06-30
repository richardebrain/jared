import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon } from 'lucide-react';

interface PortfolioEntry {
  id: number;
  childId: number;
  teacherId: number;
  schoolId: number;
  title: string;
  description: string;
  entryDate: string;
  photos: string[];
  aiAnalysis: any;
  naeyc_standards: string[];
  teacherNotes: string;
  milestones: string[];
  skills: string[];
  createdAt: string;
}

interface PortfolioEntryListProps {
  entries: PortfolioEntry[];
  isLoading: boolean;
}

export default function PortfolioEntryList({ entries, isLoading }: PortfolioEntryListProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
        <CardDescription>Previous portfolio entries for this child</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No portfolio entries yet. Create the first one!
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">{entry.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(entry.entryDate).toLocaleDateString()}
                </p>
                {entry.photos.length > 0 && (
                  <Badge variant="outline" className="mt-2">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {entry.photos.length} photo{entry.photos.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 