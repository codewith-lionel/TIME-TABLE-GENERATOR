# Timetable Generation Algorithm - Technical Deep Dive

## Overview

This document provides a comprehensive explanation of the constraint-based scheduling algorithm used in the Advanced Timetable Generator.

## Problem Statement

**Given:**
- Multiple classes (e.g., First Year, Second Year, Third Year)
- Multiple subjects per class with weekly hour requirements
- Multiple teachers with constraints and preferences
- Subject-to-teacher allocations
- Time grid (Day Orders × Hours per Day)

**Generate:**
- A complete timetable for all classes that:
  1. Satisfies all hard constraints (MUST)
  2. Optimizes soft constraints (SHOULD)
  3. Maximizes quality metrics

## Hard Constraints (Mandatory)

### 1. No Teacher Clash
A teacher cannot be assigned to multiple classes at the same (day, hour).

**Implementation:**
```javascript
teacherAvailability[teacherId][dayOrder][hour] = boolean

// Before assigning slot
if (!teacherAvailability[teacherId][day][hour]) {
  // Slot invalid - teacher busy elsewhere
}

// After assigning slot
teacherAvailability[teacherId][day][hour] = false;
```

### 2. Teacher Daily Limit
A teacher cannot exceed their maximum hours per day.

**Implementation:**
```javascript
teacherDailyHours[teacherId][dayOrder] = count

// Before assigning slot
if (teacherDailyHours[teacherId][day] >= teacher.maxHoursPerDay) {
  // Slot invalid - daily limit reached
}

// After assigning slot
teacherDailyHours[teacherId][day]++;
```

### 3. Subject Coverage
Each subject must be scheduled for exactly its required weekly hours.

**Implementation:**
```javascript
subjectRemainingHours[allocationId] = weeklyHours

// Initially set to weekly hours
// Decremented after each assignment
// Generation fails if any subject has remaining hours > 0
```

### 4. Class Slot Uniqueness
Each class can have only one subject per (day, hour).

**Implementation:**
```javascript
timetable[classId][dayOrder][hour] = { subjectId, teacherId }

// Before assigning
if (timetable[classId][day][hour] !== null) {
  // Slot invalid - already occupied
}
```

## Soft Constraints (Optimization)

### 1. Teacher Day Preferences
Teachers prefer certain day orders.

**Scoring:** +50 points if slot matches preferred day

### 2. Teacher Time Slot Preferences
Teachers prefer morning or afternoon slots.

**Scoring:** 
- +30 points for morning/afternoon match
- +40 points for specific hour match

### 3. Subject Priority
HIGH priority subjects should get better slots (morning).

**Scoring:** +20 points for HIGH priority in morning slots

### 4. Subject Distribution
Avoid scheduling same subject consecutively.

**Scoring:** -10 points for consecutive slots

### 5. Day Spread
Prefer spreading subject hours across different days.

**Scoring:** +10 points if subject not yet scheduled on that day

## Algorithm Flow

### Phase 1: Initialization

```
FUNCTION initialize():
  1. Load global settings (day orders, hours per day, breaks)
  2. Load all classes from database
  3. Load all allocations (subject-teacher mappings)
  4. Load all teachers
  
  5. Create teacherMap for quick lookups
  
  6. Initialize teacherAvailability matrix:
     FOR each teacher:
       FOR each day in [1..numDayOrders]:
         FOR each hour in [1..hoursPerDay]:
           IF hour is break hour:
             availability[teacher][day][hour] = false
           ELSE:
             availability[teacher][day][hour] = true
  
  7. Initialize teacherDailyHours counters:
     FOR each teacher:
       FOR each day in [1..numDayOrders]:
         dailyHours[teacher][day] = 0
  
  8. Initialize subjectRemainingHours:
     FOR each allocation:
       remainingHours[allocation] = allocation.weeklyHours
  
  9. Initialize timetable structure:
     FOR each class:
       FOR each day in [1..numDayOrders]:
         FOR each hour in [1..hoursPerDay]:
           IF hour not break hour:
             timetable[class][day][hour] = null
  
  RETURN initialized structures
```

### Phase 2: Prioritization

```
FUNCTION sortAllocationsByPriority(allocations):
  DEFINE priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 }
  
  SORT allocations BY:
    PRIMARY: priorityOrder[allocation.priority]
    SECONDARY: allocation.weeklyHours (descending)
  
  RETURN sorted allocations
```

**Why Priority-Based Scheduling?**
- HIGH priority subjects (core, labs) need optimal slots
- Scheduling them first ensures they get morning slots
- LOW priority subjects are more flexible

### Phase 3: Slot Selection

```
FUNCTION findBestSlot(allocation):
  bestSlot = null
  bestScore = -∞
  
  FOR each day in [1..numDayOrders]:
    FOR each hour in [1..hoursPerDay]:
      
      // Skip break hours
      IF hour is break hour:
        CONTINUE
      
      // Check hard constraints
      IF NOT isSlotValid(allocation, day, hour):
        CONTINUE
      
      // Calculate preference score
      score = calculateSlotScore(allocation, day, hour)
      
      // Track best option
      IF score > bestScore:
        bestScore = score
        bestSlot = { day, hour }
  
  RETURN bestSlot
```

### Phase 4: Constraint Validation

```
FUNCTION isSlotValid(allocation, day, hour):
  classId = allocation.classId
  teacherId = allocation.teacherId
  
  // 1. Check class slot availability
  IF timetable[classId][day][hour] !== null:
    RETURN false
  
  // 2. Check teacher availability (no clash)
  IF NOT teacherAvailability[teacherId][day][hour]:
    RETURN false
  
  // 3. Check teacher daily hour limit
  teacher = teacherMap[teacherId]
  IF teacherDailyHours[teacherId][day] >= teacher.maxHoursPerDay:
    RETURN false
  
  RETURN true
```

### Phase 5: Preference Scoring

```
FUNCTION calculateSlotScore(allocation, day, hour):
  score = 0
  teacher = teacherMap[allocation.teacherId]
  
  // 1. Teacher day preference (+50)
  IF teacher.preferredDayOrders.includes(day):
    score += 50
  
  // 2. Teacher time slot preference (+30-40)
  morningEnd = floor(hoursPerDay / 2)
  
  IF teacher.preferredTimeSlots.morning AND hour <= morningEnd:
    score += 30
  
  IF teacher.preferredTimeSlots.afternoon AND hour > morningEnd:
    score += 30
  
  IF teacher.preferredTimeSlots.specific.includes(hour):
    score += 40
  
  // 3. Priority-based scoring (+20)
  IF allocation.priority == 'HIGH' AND hour <= morningEnd:
    score += 20
  
  // 4. Consecutive slot penalty (-10)
  IF hasConsecutiveSlot(allocation.classId, day, hour, allocation.subjectId):
    score -= 10
  
  // 5. Distribution bonus (+10)
  IF NOT subjectScheduledOnDay(allocation.classId, day, allocation.subjectId):
    score += 10
  
  RETURN score
```

**Scoring Examples:**

**Example 1: Optimal Slot**
- Teacher prefers day: +50
- Morning preference match: +30
- HIGH priority in morning: +20
- New day for subject: +10
- **Total: 110 points**

**Example 2: Acceptable Slot**
- Teacher prefers day: +50
- No time preference match: 0
- Not consecutive: 0
- Subject already on this day: 0
- **Total: 50 points**

**Example 3: Poor Slot**
- Teacher doesn't prefer day: 0
- No time preference match: 0
- Consecutive slot: -10
- **Total: -10 points**

### Phase 6: Slot Assignment

```
FUNCTION assignSlot(allocation, slot):
  day = slot.day
  hour = slot.hour
  classId = allocation.classId
  teacherId = allocation.teacherId
  subjectId = allocation.subjectId
  
  // 1. Update timetable
  timetable[classId][day][hour] = {
    subjectId: subjectId,
    teacherId: teacherId,
    allocationId: allocation.id
  }
  
  // 2. Mark teacher as busy
  teacherAvailability[teacherId][day][hour] = false
  
  // 3. Increment teacher daily hours
  teacherDailyHours[teacherId][day]++
  
  // 4. Decrement subject remaining hours
  subjectRemainingHours[allocation.id]--
```

### Phase 7: Main Generation Loop

```
FUNCTION scheduleAllSubjects(sortedAllocations):
  FOR each allocation in sortedAllocations:
    remainingHours = subjectRemainingHours[allocation.id]
    
    FOR i in [1..remainingHours]:
      slot = findBestSlot(allocation)
      
      IF slot is null:
        RETURN {
          success: false,
          error: "Cannot schedule " + allocation.subjectName
        }
      
      assignSlot(allocation, slot)
  
  RETURN { success: true }
```

### Phase 8: Output Generation

```
FUNCTION convertTimetableToEntries():
  entries = []
  
  FOR each class:
    FOR each day in [1..numDayOrders]:
      FOR each hour in [1..hoursPerDay]:
        slot = timetable[class][day][hour]
        
        entry = {
          classId: class.id,
          dayOrder: day,
          hour: hour,
          subjectId: slot ? slot.subjectId : null,
          teacherId: slot ? slot.teacherId : null
        }
        
        entries.push(entry)
  
  RETURN entries
```

## Complexity Analysis

### Time Complexity

**Best Case:** O(S × D × H)
- S = number of subject-hour pairs to schedule
- D = number of day orders
- H = number of hours per day

**Average Case:** O(S × D × H × log(S))
- Sorting adds log(S) factor

**Worst Case:** O(S × D × H × T × C)
- T = number of teachers
- C = number of classes
- When many constraints make finding slots difficult

### Space Complexity

O(T × D × H + C × D × H)
- Teacher availability matrix: T × D × H
- Timetable structure: C × D × H
- Other structures are linear

## Real-World Example

**Setup:**
- 3 classes
- 5 day orders
- 6 hours per day (break at hour 3,4)
- 15 subjects total
- 5 teachers

**Available Slots per Class:**
- Total: 5 days × 6 hours = 30 hours
- Breaks: 5 days × 2 hours = 10 hours
- **Usable: 20 hours per class**

**Total Available Slots:**
- 3 classes × 20 hours = **60 slots**

**Total Required:**
- If subjects average 3 hours/week
- 15 subjects × 3 hours = **45 hours**

**Utilization:**
- 45 / 60 = **75%**

## Optimization Techniques

### 1. Early Pruning
Skip slots that fail hard constraints immediately.

### 2. Greedy Slot Selection
Always choose highest-scoring slot available.

### 3. Priority-First Scheduling
HIGH priority subjects get first pick of slots.

### 4. Global Availability Tracking
Prevents need to check for clashes across classes.

### 5. Incremental Updates
Update only affected structures after each assignment.

## Failure Scenarios

### Scenario 1: Over-Subscription
**Problem:** More required hours than available slots

**Detection:**
```
totalRequired = sum(subject.weeklyHours for all subjects)
totalAvailable = classes × dayOrders × (hoursPerDay - breakHours)

IF totalRequired > totalAvailable:
  FAIL("Not enough slots")
```

### Scenario 2: Teacher Over-Commitment
**Problem:** Teacher assigned more hours than possible

**Detection:**
```
teacherHours = sum(hours for subjects taught by teacher)
maxPossible = teacher.maxHoursPerDay × numDayOrders

IF teacherHours > maxPossible:
  FAIL("Teacher over-committed")
```

### Scenario 3: Impossible Preferences
**Problem:** Preferences too restrictive

**Solution:** Algorithm allows scheduling outside preferences (with lower score)

## Quality Metrics

### Utilization Rate
```
utilizationRate = (filledSlots / totalSlots) × 100%
```

### Preference Match Rate
```
preferenceMatchRate = (slotsMatchingPreferences / totalFilledSlots) × 100%
```

### Clash Count
```
clashCount = 0  // Always 0 (hard constraint)
```

### Balance Score
```
balanceScore = 1 - (stdDev(teacherHours) / mean(teacherHours))
```

## Future Enhancements

1. **Backtracking:** Undo assignments if stuck
2. **Simulated Annealing:** Improve solution quality
3. **Multi-Objective Optimization:** Balance multiple criteria
4. **Room Assignment:** Add classroom constraints
5. **Student Groups:** Handle split classes
6. **Parallel Processing:** Speed up large-scale generation

## Conclusion

This algorithm provides a robust, efficient solution for multi-class timetable generation with:
- ✅ Zero teacher clashes (guaranteed)
- ✅ Respect for all hard constraints
- ✅ Optimization of soft constraints
- ✅ Scalable to real-world scenarios
- ✅ Clear failure messages when impossible

The combination of priority-based scheduling, preference scoring, and global conflict tracking ensures high-quality timetables that meet institutional needs.
