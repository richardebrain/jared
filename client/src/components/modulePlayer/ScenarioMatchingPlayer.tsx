import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  closestCenter,
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
  const [leftItems, setLeftItems] = useState(activity.pairs.map(p => ({ id: p.id, content: p.left })));
  const [matches, setMatches] = useState<{ [key: string]: string }>({}); // rightId: leftId
  const [assignedLefts, setAssignedLefts] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && !assignedLefts.has(active.id)) {
      setMatches(prev => ({ ...prev, [over.id]: active.id }));
      setAssignedLefts(prev => new Set(prev).add(active.id));
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    activity.pairs.forEach(pair => {
      if (matches[pair.id] === pair.id) correct++;
    });
    setShowResults(true);
    const points = correct === activity.pairs.length ? 12 : 6;
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
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Scenarios</h4>
              {leftItems.map(item => (
                !assignedLefts.has(item.id) && (
                  <DraggableItem key={item.id} id={item.id} content={item.content} />
                )
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Match To</h4>
              {activity.pairs.map(pair => {
                const matchedLeftId = matches[pair.id];
                const matchedLeft = leftItems.find(i => i.id === matchedLeftId);
                const isCorrect = showResults && pair.id === matchedLeftId;
                return (
                  <DroppableSlot key={pair.id} id={pair.id}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{pair.right}</span>
                      <span className={`text-xs ${showResults ? (isCorrect ? 'text-green-600' : 'text-red-500') : 'text-muted-foreground'}`}>
                        {matchedLeft?.content || 'Drop a scenario here'}
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
            You got {Object.keys(matches).filter(key => key === matches[key]).length} out of {activity.pairs.length} correct.
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
