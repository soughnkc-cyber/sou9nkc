
import { 
  addDays, 
  setHours, 
  setMinutes, 
  setSeconds, 
  setMilliseconds, 
  isBefore, 
  isAfter, 
  differenceInMinutes, 
  getDay,
  startOfDay,
  endOfDay,
  min,
  max
} from 'date-fns';

export interface WorkSettings {
  workStart: string; // "HH:mm"
  workEnd: string;   // "HH:mm"
  workDays: number[]; // [0,1,2,3,4,5,6] (0=Sunday)
  breakStart?: string | null; // "HH:mm"
  breakEnd?: string | null;   // "HH:mm"
}

/**
 * Calculates net minutes between two dates within working hours.
 */
export function calculateWorkMinutes(start: Date, end: Date, settings: WorkSettings): number {
  if (isAfter(start, end)) return 0;

  let totalMinutes = 0;
  let cursor = startOfDay(start);
  const finish = endOfDay(end);

  const [wsH, wsM] = settings.workStart.split(':').map(Number);
  const [weH, weM] = settings.workEnd.split(':').map(Number);
  
  const hasBreak = settings.breakStart && settings.breakEnd;
  const [bsH, bsM] = hasBreak ? settings.breakStart!.split(':').map(Number) : [0, 0];
  const [beH, beM] = hasBreak ? settings.breakEnd!.split(':').map(Number) : [0, 0];

  while (isBefore(cursor, finish)) {
    const dayOfWeek = getDay(cursor);
    
    if (settings.workDays.includes(dayOfWeek)) {
      // Working day
      const dayStart = setMilliseconds(setSeconds(setMinutes(setHours(cursor, wsH), wsM), 0), 0);
      const dayEnd = setMilliseconds(setSeconds(setMinutes(setHours(cursor, weH), weM), 0), 0);
      
      // Overlap of [dayStart, dayEnd] with [start, end]
      const overlapStart = max([start, dayStart]);
      const overlapEnd = min([end, dayEnd]);

      if (isBefore(overlapStart, overlapEnd)) {
        let dailyMinutes = differenceInMinutes(overlapEnd, overlapStart);
        
        // Subtract break time if it overlaps
        if (hasBreak) {
          const breakStart = setMilliseconds(setSeconds(setMinutes(setHours(cursor, bsH), bsM), 0), 0);
          const breakEnd = setMilliseconds(setSeconds(setMinutes(setHours(cursor, beH), beM), 0), 0);
          
          const breakOverlapStart = max([overlapStart, breakStart]);
          const breakOverlapEnd = min([overlapEnd, breakEnd]);
          
          if (isBefore(breakOverlapStart, breakOverlapEnd)) {
            dailyMinutes -= differenceInMinutes(breakOverlapEnd, breakOverlapStart);
          }
        }
        
        totalMinutes += dailyMinutes;
      }
    }
    
    cursor = addDays(cursor, 1);
  }

  return totalMinutes;
}
