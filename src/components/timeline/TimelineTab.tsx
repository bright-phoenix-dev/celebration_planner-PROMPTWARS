'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useTimeline } from '@/hooks/useTimeline';
import { TIMELINE_PHASE_LABELS } from '@/schemas';
import { formatDate } from '@/lib/constants';

/**
 * Timeline tab showing backward-planned tasks grouped by phase.
 */
export function TimelineTab() {
  const { groupedTasks, progress, toggleTask } = useTimeline();

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            Timeline Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress
              value={progress}
              className="flex-1"
              aria-label={`Timeline progress: ${String(progress)}% complete`}
            />
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Phase groups */}
      {Array.from(groupedTasks.entries()).map(([phase, tasks]) => {
        const phaseDone = tasks.every((t) => t.completed);
        const phaseLabel = TIMELINE_PHASE_LABELS[phase];

        return (
          <Card key={phase}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {phaseLabel}
                {phaseDone ? (
                  <Badge variant="success" className="ml-auto">
                    <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-auto">
                    {tasks.filter((t) => t.completed).length}/{tasks.length}
                  </Badge>
                )}
              </CardTitle>
              {tasks[0] && (
                <p className="text-xs text-muted-foreground">
                  Due by {formatDate(tasks[0].dueDate)}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" aria-label={`Tasks for ${phaseLabel}`}>
                {tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      onClick={() => {
                        toggleTask(task.id);
                      }}
                      className="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
                      aria-label={`${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                    >
                      {task.completed ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-success"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`text-sm ${task.completed ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {task.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {groupedTasks.size === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No timeline tasks to display.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
