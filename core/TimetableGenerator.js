/**
 * Advanced Timetable Generator with Constraint-Based Scheduling
 * 
 * This class implements a sophisticated algorithm for generating timetables
 * across multiple classes while respecting all hard constraints and optimizing
 * for soft constraints (preferences).
 * 
 * ALGORITHM OVERVIEW:
 * 1. Initialize global teacher availability matrix
 * 2. Sort subjects by priority (HIGH -> MEDIUM -> LOW)
 * 3. For each subject, find the best slot considering:
 *    - Teacher availability (no clashes)
 *    - Teacher daily hour limits
 *    - Teacher preferences (day orders and time slots)
 *    - Subject distribution (avoid consecutive slots)
 * 4. Use backtracking if no valid slot is found
 * 5. Return the generated timetable with statistics
 */

class TimetableGenerator {
  constructor(dbService) {
    this.dbService = dbService;
  }

  /**
   * Main generation method - generates timetable for all classes
   */
  generate() {
    try {
      // 1. Load all required data
      const settings = this.dbService.getGlobalSettings();
      if (!settings) {
        return { success: false, error: 'Please configure global settings first' };
      }

      const classes = this.dbService.getClasses();
      if (classes.length === 0) {
        return { success: false, error: 'Please add at least one class' };
      }

      const allocations = this.dbService.getAllocations();
      if (allocations.length === 0) {
        return { success: false, error: 'Please allocate teachers to subjects' };
      }

      const teachers = this.dbService.getTeachers();

      // 2. Initialize data structures
      this.settings = settings;
      this.classes = classes;
      this.allocations = allocations;
      this.teachers = teachers;
      this.teacherMap = new Map(teachers.map(t => [t.id, t]));
      
      // Teacher availability matrix: [teacherId][dayOrder][hour] = true/false
      this.teacherAvailability = this.initializeAvailabilityMatrix();
      
      // Teacher daily hour counters: [teacherId][dayOrder] = hourCount
      this.teacherDailyHours = this.initializeDailyHourCounters();
      
      // Subject remaining hours: [allocationId] = remainingHours
      this.subjectRemainingHours = new Map(
        allocations.map(a => [a.id, a.weekly_hours])
      );

      // Timetable structure: [classId][dayOrder][hour] = { subjectId, teacherId, allocationId }
      this.timetable = this.initializeTimetable();

      // 3. Sort allocations by priority for optimal placement
      const sortedAllocations = this.sortAllocationsByPriority(allocations);

      // 4. Generate timetable using constraint-based scheduling
      const result = this.scheduleAllSubjects(sortedAllocations);
      
      if (!result.success) {
        return result;
      }

      // 5. Convert timetable to database format
      const timetableEntries = this.convertTimetableToEntries();

      // 6. Calculate statistics
      const stats = this.calculateStatistics();

      return {
        success: true,
        timetable: timetableEntries,
        stats: stats
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize teacher availability matrix
   * true = available, false = busy
   */
  initializeAvailabilityMatrix() {
    const matrix = {};
    this.teachers.forEach(teacher => {
      matrix[teacher.id] = {};
      for (let day = 1; day <= this.settings.numDayOrders; day++) {
        matrix[teacher.id][day] = {};
        for (let hour = 1; hour <= this.settings.hoursPerDay; hour++) {
          // Mark break hours as unavailable
          const isBreak = this.settings.breakHours.includes(hour);
          matrix[teacher.id][day][hour] = !isBreak;
        }
      }
    });
    return matrix;
  }

  /**
   * Initialize teacher daily hour counters
   */
  initializeDailyHourCounters() {
    const counters = {};
    this.teachers.forEach(teacher => {
      counters[teacher.id] = {};
      for (let day = 1; day <= this.settings.numDayOrders; day++) {
        counters[teacher.id][day] = 0;
      }
    });
    return counters;
  }

  /**
   * Initialize empty timetable structure
   */
  initializeTimetable() {
    const tt = {};
    this.classes.forEach(cls => {
      tt[cls.id] = {};
      for (let day = 1; day <= this.settings.numDayOrders; day++) {
        tt[cls.id][day] = {};
        for (let hour = 1; hour <= this.settings.hoursPerDay; hour++) {
          // Skip break hours
          if (!this.settings.breakHours.includes(hour)) {
            tt[cls.id][day][hour] = null;
          }
        }
      }
    });
    return tt;
  }

  /**
   * Sort allocations by priority: HIGH -> MEDIUM -> LOW
   * Within same priority, sort by weekly hours (descending)
   */
  sortAllocationsByPriority(allocations) {
    const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return [...allocations].sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.weekly_hours - a.weekly_hours;
    });
  }

  /**
   * Main scheduling algorithm - schedules all subjects
   */
  scheduleAllSubjects(sortedAllocations) {
    // Process each allocation and schedule all its required hours
    for (const allocation of sortedAllocations) {
      const remainingHours = this.subjectRemainingHours.get(allocation.id);
      
      for (let i = 0; i < remainingHours; i++) {
        const slot = this.findBestSlot(allocation);
        
        if (!slot) {
          return {
            success: false,
            error: `Cannot schedule ${allocation.subject_name} for ${allocation.class_name}. No valid slot found.`
          };
        }

        // Assign the slot
        this.assignSlot(allocation, slot);
      }
    }

    return { success: true };
  }

  /**
   * Find the best available slot for a subject considering all constraints
   */
  findBestSlot(allocation) {
    let bestSlot = null;
    let bestScore = -Infinity;

    const teacher = this.teacherMap.get(allocation.teacher_id);

    // Iterate through all possible slots
    for (let day = 1; day <= this.settings.numDayOrders; day++) {
      for (let hour = 1; hour <= this.settings.hoursPerDay; hour++) {
        // Skip break hours
        if (this.settings.breakHours.includes(hour)) {
          continue;
        }

        // Check hard constraints
        if (!this.isSlotValid(allocation, day, hour)) {
          continue;
        }

        // Calculate preference score for this slot
        const score = this.calculateSlotScore(allocation, teacher, day, hour);

        if (score > bestScore) {
          bestScore = score;
          bestSlot = { day, hour };
        }
      }
    }

    return bestSlot;
  }

  /**
   * Check if a slot satisfies all hard constraints
   */
  isSlotValid(allocation, day, hour) {
    // 1. Check if class slot is available
    if (this.timetable[allocation.class_id][day][hour] !== null) {
      return false;
    }

    // 2. Check teacher availability (no clash)
    if (!this.teacherAvailability[allocation.teacher_id][day][hour]) {
      return false;
    }

    // 3. Check teacher daily hour limit
    const teacher = this.teacherMap.get(allocation.teacher_id);
    if (this.teacherDailyHours[allocation.teacher_id][day] >= teacher.max_hours_per_day) {
      return false;
    }

    return true;
  }

  /**
   * Calculate preference score for a slot (higher is better)
   */
  calculateSlotScore(allocation, teacher, day, hour) {
    let score = 0;

    // 1. Teacher preferred day orders (+50 points)
    if (teacher.preferredDayOrders && teacher.preferredDayOrders.includes(day)) {
      score += 50;
    }

    // 2. Teacher preferred time slots (+30 points)
    if (teacher.preferredTimeSlots) {
      if (teacher.preferredTimeSlots.morning && hour <= Math.floor(this.settings.hoursPerDay / 2)) {
        score += 30;
      }
      if (teacher.preferredTimeSlots.afternoon && hour > Math.floor(this.settings.hoursPerDay / 2)) {
        score += 30;
      }
      if (teacher.preferredTimeSlots.specific && teacher.preferredTimeSlots.specific.includes(hour)) {
        score += 40;
      }
    }

    // 3. Priority-based scoring
    // HIGH priority subjects prefer morning slots (+20 points)
    if (allocation.priority === 'HIGH' && hour <= Math.floor(this.settings.hoursPerDay / 2)) {
      score += 20;
    }

    // 4. Avoid consecutive slots for same subject (-10 points)
    if (this.hasConsecutiveSlot(allocation.class_id, day, hour, allocation.subject_id)) {
      score -= 10;
    }

    // 5. Distribution bonus - prefer spreading across different days (+10 points)
    if (!this.subjectScheduledOnDay(allocation.class_id, day, allocation.subject_id)) {
      score += 10;
    }

    return score;
  }

  /**
   * Check if subject already has consecutive slot
   */
  hasConsecutiveSlot(classId, day, hour, subjectId) {
    const prevHour = hour - 1;
    const nextHour = hour + 1;

    if (prevHour >= 1 && this.timetable[classId][day][prevHour]) {
      if (this.timetable[classId][day][prevHour].subjectId === subjectId) {
        return true;
      }
    }

    if (nextHour <= this.settings.hoursPerDay && this.timetable[classId][day][nextHour]) {
      if (this.timetable[classId][day][nextHour].subjectId === subjectId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if subject already scheduled on this day
   */
  subjectScheduledOnDay(classId, day, subjectId) {
    for (let hour = 1; hour <= this.settings.hoursPerDay; hour++) {
      if (this.timetable[classId][day][hour] && 
          this.timetable[classId][day][hour].subjectId === subjectId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Assign a slot to a subject
   */
  assignSlot(allocation, slot) {
    const { day, hour } = slot;

    // Update timetable
    this.timetable[allocation.class_id][day][hour] = {
      subjectId: allocation.subject_id,
      teacherId: allocation.teacher_id,
      allocationId: allocation.id
    };

    // Mark teacher as busy
    this.teacherAvailability[allocation.teacher_id][day][hour] = false;

    // Increment teacher daily hours
    this.teacherDailyHours[allocation.teacher_id][day]++;

    // Decrement subject remaining hours
    const remaining = this.subjectRemainingHours.get(allocation.id);
    this.subjectRemainingHours.set(allocation.id, remaining - 1);
  }

  /**
   * Convert internal timetable to database format
   */
  convertTimetableToEntries() {
    const entries = [];

    this.classes.forEach(cls => {
      for (let day = 1; day <= this.settings.numDayOrders; day++) {
        for (let hour = 1; hour <= this.settings.hoursPerDay; hour++) {
          const slot = this.timetable[cls.id][day][hour];
          entries.push({
            classId: cls.id,
            dayOrder: day,
            hour: hour,
            subjectId: slot ? slot.subjectId : null,
            teacherId: slot ? slot.teacherId : null
          });
        }
      }
    });

    return entries;
  }

  /**
   * Calculate generation statistics
   */
  calculateStatistics() {
    let totalSlots = 0;
    let filledSlots = 0;
    let preferredSlots = 0;

    this.classes.forEach(cls => {
      for (let day = 1; day <= this.settings.numDayOrders; day++) {
        for (let hour = 1; hour <= this.settings.hoursPerDay; hour++) {
          if (this.settings.breakHours.includes(hour)) {
            continue;
          }
          totalSlots++;
          const slot = this.timetable[cls.id][day][hour];
          if (slot) {
            filledSlots++;
            
            // Check if slot matches teacher preferences
            const teacher = this.teacherMap.get(slot.teacherId);
            if (teacher.preferredDayOrders && teacher.preferredDayOrders.includes(day)) {
              preferredSlots++;
            }
          }
        }
      }
    });

    return {
      totalSlots,
      filledSlots,
      emptySlots: totalSlots - filledSlots,
      utilizationRate: ((filledSlots / totalSlots) * 100).toFixed(2) + '%',
      preferenceMatchRate: filledSlots > 0 ? ((preferredSlots / filledSlots) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Validate a manual slot change
   */
  validateSlotChange(slotData) {
    const { classId, dayOrder, hour, subjectId, teacherId } = slotData;

    // If clearing the slot, always valid
    if (!subjectId && !teacherId) {
      return { valid: true };
    }

    // Check teacher clash - is teacher already busy at this time?
    const timetable = this.dbService.getTimetable();
    const teacherConflict = timetable.find(entry => 
      entry.teacher_id === teacherId &&
      entry.day_order === dayOrder &&
      entry.hour === hour &&
      entry.class_id !== classId
    );

    if (teacherConflict) {
      return {
        valid: false,
        reason: `Teacher is already teaching ${teacherConflict.subject_name} in ${teacherConflict.class_name} at this time`
      };
    }

    // Check teacher daily limit
    const teacherDaySlots = timetable.filter(entry =>
      entry.teacher_id === teacherId &&
      entry.day_order === dayOrder &&
      entry.subject_id !== null
    );

    const teacher = this.dbService.getTeachers().find(t => t.id === teacherId);
    if (teacherDaySlots.length >= teacher.max_hours_per_day) {
      return {
        valid: false,
        reason: `Teacher has reached maximum hours (${teacher.max_hours_per_day}) for this day`
      };
    }

    return { valid: true };
  }

  /**
   * Get teacher workload report
   */
  getTeacherWorkload() {
    const timetable = this.dbService.getTimetable();
    const teachers = this.dbService.getTeachers();
    const workload = [];

    teachers.forEach(teacher => {
      const teacherSlots = timetable.filter(entry => entry.teacher_id === teacher.id);
      
      // Calculate daily hours
      const dailyHours = {};
      for (let day = 1; day <= (this.settings?.numDayOrders || 5); day++) {
        dailyHours[day] = teacherSlots.filter(entry => entry.day_order === day).length;
      }

      // Calculate weekly hours
      const weeklyHours = teacherSlots.length;

      workload.push({
        teacherId: teacher.id,
        teacherName: teacher.name,
        weeklyHours,
        dailyHours,
        maxHoursPerDay: teacher.max_hours_per_day,
        subjects: [...new Set(teacherSlots.map(s => s.subject_name).filter(Boolean))]
      });
    });

    return workload;
  }
}

module.exports = TimetableGenerator;
