const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'timetable.db');
    this.db = null;
  }

  initialize() {
    this.db = new Database(this.dbPath);
    this.createTables();
  }

  createTables() {
    // Global Settings Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS global_settings (
        id INTEGER PRIMARY KEY,
        num_day_orders INTEGER NOT NULL,
        hours_per_day INTEGER NOT NULL,
        break_hours TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Classes Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subjects Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        weekly_hours INTEGER NOT NULL,
        priority TEXT NOT NULL CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')),
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        UNIQUE(name, class_id)
      )
    `);

    // Teachers Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        max_hours_per_day INTEGER NOT NULL,
        preferred_day_orders TEXT,
        preferred_time_slots TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subject-Teacher Allocation Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE(subject_id)
      )
    `);

    // Timetable Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        day_order INTEGER NOT NULL,
        hour INTEGER NOT NULL,
        subject_id INTEGER,
        teacher_id INTEGER,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
        UNIQUE(class_id, day_order, hour)
      )
    `);
  }

  // Global Settings Methods
  saveGlobalSettings(settings) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO global_settings (id, num_day_orders, hours_per_day, break_hours)
      VALUES (1, ?, ?, ?)
    `);
    stmt.run(
      settings.numDayOrders,
      settings.hoursPerDay,
      JSON.stringify(settings.breakHours || [])
    );
  }

  getGlobalSettings() {
    const stmt = this.db.prepare('SELECT * FROM global_settings WHERE id = 1');
    const row = stmt.get();
    if (!row) return null;
    
    return {
      numDayOrders: row.num_day_orders,
      hoursPerDay: row.hours_per_day,
      breakHours: JSON.parse(row.break_hours || '[]')
    };
  }

  // Classes Methods
  saveClass(classData) {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO classes (id, name) VALUES (?, ?)');
    const info = stmt.run(classData.id || null, classData.name);
    return info.lastInsertRowid;
  }

  getClasses() {
    const stmt = this.db.prepare('SELECT * FROM classes ORDER BY name');
    return stmt.all();
  }

  deleteClass(id) {
    const stmt = this.db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run(id);
  }

  // Subjects Methods
  saveSubject(subjectData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO subjects (id, name, class_id, weekly_hours, priority)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      subjectData.id || null,
      subjectData.name,
      subjectData.classId,
      subjectData.weeklyHours,
      subjectData.priority
    );
    return info.lastInsertRowid;
  }

  getSubjects(classId) {
    let stmt;
    if (classId) {
      stmt = this.db.prepare('SELECT * FROM subjects WHERE class_id = ? ORDER BY priority, name');
      return stmt.all(classId);
    } else {
      stmt = this.db.prepare('SELECT * FROM subjects ORDER BY class_id, priority, name');
      return stmt.all();
    }
  }

  deleteSubject(id) {
    const stmt = this.db.prepare('DELETE FROM subjects WHERE id = ?');
    stmt.run(id);
  }

  // Teachers Methods
  saveTeacher(teacherData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO teachers (id, name, max_hours_per_day, preferred_day_orders, preferred_time_slots)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      teacherData.id || null,
      teacherData.name,
      teacherData.maxHoursPerDay,
      JSON.stringify(teacherData.preferredDayOrders || []),
      JSON.stringify(teacherData.preferredTimeSlots || {})
    );
    return info.lastInsertRowid;
  }

  getTeachers() {
    const stmt = this.db.prepare('SELECT * FROM teachers ORDER BY name');
    const teachers = stmt.all();
    return teachers.map(t => ({
      ...t,
      preferredDayOrders: JSON.parse(t.preferred_day_orders || '[]'),
      preferredTimeSlots: JSON.parse(t.preferred_time_slots || '{}')
    }));
  }

  deleteTeacher(id) {
    const stmt = this.db.prepare('DELETE FROM teachers WHERE id = ?');
    stmt.run(id);
  }

  // Allocations Methods
  saveAllocation(allocationData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO allocations (id, subject_id, teacher_id)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(
      allocationData.id || null,
      allocationData.subjectId,
      allocationData.teacherId
    );
    return info.lastInsertRowid;
  }

  getAllocations() {
    const stmt = this.db.prepare(`
      SELECT a.id, a.subject_id, a.teacher_id,
             s.name as subject_name, s.class_id, s.weekly_hours, s.priority,
             t.name as teacher_name,
             c.name as class_name
      FROM allocations a
      JOIN subjects s ON a.subject_id = s.id
      JOIN teachers t ON a.teacher_id = t.id
      JOIN classes c ON s.class_id = c.id
      ORDER BY c.name, s.name
    `);
    return stmt.all();
  }

  deleteAllocation(id) {
    const stmt = this.db.prepare('DELETE FROM allocations WHERE id = ?');
    stmt.run(id);
  }

  // Timetable Methods
  saveTimetable(timetable) {
    // Clear existing timetable
    this.db.prepare('DELETE FROM timetable').run();

    // Insert new timetable
    const stmt = this.db.prepare(`
      INSERT INTO timetable (class_id, day_order, hour, subject_id, teacher_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((entries) => {
      for (const entry of entries) {
        stmt.run(
          entry.classId,
          entry.dayOrder,
          entry.hour,
          entry.subjectId || null,
          entry.teacherId || null
        );
      }
    });

    insertMany(timetable);
  }

  getTimetable() {
    const stmt = this.db.prepare(`
      SELECT t.*, 
             s.name as subject_name,
             s.priority,
             te.name as teacher_name,
             c.name as class_name
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN teachers te ON t.teacher_id = te.id
      JOIN classes c ON t.class_id = c.id
      ORDER BY c.name, t.day_order, t.hour
    `);
    return stmt.all();
  }

  updateTimetableSlot(slotData) {
    const stmt = this.db.prepare(`
      UPDATE timetable
      SET subject_id = ?, teacher_id = ?
      WHERE class_id = ? AND day_order = ? AND hour = ?
    `);
    stmt.run(
      slotData.subjectId || null,
      slotData.teacherId || null,
      slotData.classId,
      slotData.dayOrder,
      slotData.hour
    );
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseService;
