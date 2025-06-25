import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  rectIntersection,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'; 
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

interface MatchingActivityProps {
  activity: {
    type?: string;
    title: string;
    instructions: string;
    pairs: MatchingPair[];
  };
  onComplete: (points: number) => void;
}

function DraggableItem({ id, content }: { id: string; content: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="p-2 border rounded bg-white shadow-sm"
    >
      {content}
    </div>
  );
}

function DroppableSlot({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[40px] p-2 border rounded bg-gray-50 ${isOver ? 'bg-green-100' : ''}`}
    >
      {children}
    </div>
  );
}

export default function MatchingActivityPlayer({ activity, onComplete }: MatchingActivityProps) {
  // Create proper IDs for pairs since they don't have them from AI generation
  const pairsWithIds = activity.pairs.map((pair, index) => ({
    ...pair,
    id: pair.id || `pair-${index}`,
    leftId: `left-${index}`,
    rightId: `right-${index}`
  }));

  // Shuffle function to randomize order
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Create shuffled left items and right options
  const [leftItems, setLeftItems] = useState(() => 
    shuffleArray(pairsWithIds.map(p => ({ id: p.leftId, content: p.left, pairId: p.id })))
  );
  const [rightOptions] = useState(() => shuffleArray(pairsWithIds));
  const [matches, setMatches] = useState<{ [key: string]: string }>({}); // rightId: leftId
  const [showResults, setShowResults] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      setMatches(prev => ({ ...prev, [over.id as string]: active.id as string }));
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    pairsWithIds.forEach(pair => {
      if (matches[pair.rightId] === pair.leftId) correct++;
    });
    setShowResults(true);
    const points = correct === pairsWithIds.length ? 12 : 6;
    if (points === 12) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    onComplete(points);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {activity.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{activity.instructions}</p>
      </CardHeader>
      <CardContent>
        <DndContext onDragEnd={handleDragEnd} collisionDetection={rectIntersection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Items</h4>
              {leftItems.map(item => (
                <DraggableItem key={item.id} id={item.id} content={item.content} />
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Match With</h4>
              {rightOptions.map(pair => {
                const matchedLeft = leftItems.find(i => i.id === matches[pair.rightId]);
                const isCorrect = showResults && pair.leftId === matches[pair.rightId];
                return (
                  <DroppableSlot key={pair.rightId} id={pair.rightId}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{pair.right}</span>
                      <span className={`text-xs ${showResults ? (isCorrect ? 'text-green-600' : 'text-red-500') : 'text-muted-foreground'}`}>
                        {matchedLeft?.content || 'Drop here'}
                      </span>
                    </div>
                  </DroppableSlot>
                );
              })}
            </div>
          </div>
        </DndContext>

        {showResults && (
          <div className="mt-4 text-sm text-gray-700">
            You got {pairsWithIds.filter(pair => matches[pair.rightId] === pair.leftId).length} out of {pairsWithIds.length} correct.
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={checkAnswers} disabled={showResults} className="w-full">
          {showResults ? 'Completed!' : 'Check Answers'}
          <CheckCircle2 className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
