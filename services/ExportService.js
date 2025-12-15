const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const XLSX = require('xlsx');
const path = require('path');
const { app, dialog } = require('electron');
const fs = require('fs');

class ExportService {
  constructor(dbService) {
    this.dbService = dbService;
  }

  /**
   * Export timetable based on options
   */
  async export(options) {
    const { format, type, classId } = options;

    if (format === 'pdf') {
      return this.exportToPDF(type, classId);
    } else if (format === 'excel') {
      return this.exportToExcel(type, classId);
    }

    throw new Error('Unsupported export format');
  }

  /**
   * Export to PDF
   */
  async exportToPDF(type, classId) {
    const doc = new jsPDF('landscape');
    
    if (type === 'class-timetable') {
      return this.exportClassTimetablePDF(doc, classId);
    } else if (type === 'all-timetables') {
      return this.exportAllTimetablesPDF(doc);
    } else if (type === 'teacher-workload') {
      return this.exportTeacherWorkloadPDF(doc);
    }
  }

  /**
   * Export single class timetable to PDF
   */
  exportClassTimetablePDF(doc, classId) {
    const settings = this.dbService.getGlobalSettings();
    const classes = this.dbService.getClasses();
    const cls = classes.find(c => c.id === classId);
    const timetable = this.dbService.getTimetable();

    // Filter timetable for this class
    const classTimetable = timetable.filter(entry => entry.class_id === classId);

    // Title
    doc.setFontSize(16);
    doc.text(`Timetable - ${cls.name}`, 14, 15);

    // Prepare table data
    const headers = [['Hour', ...Array.from({ length: settings.numDayOrders }, (_, i) => `Day ${i + 1}`)]];
    const rows = [];

    for (let hour = 1; hour <= settings.hoursPerDay; hour++) {
      const row = [`Hour ${hour}`];
      
      if (settings.breakHours.includes(hour)) {
        for (let day = 1; day <= settings.numDayOrders; day++) {
          row.push('BREAK');
        }
      } else {
        for (let day = 1; day <= settings.numDayOrders; day++) {
          const entry = classTimetable.find(e => e.day_order === day && e.hour === hour);
          if (entry && entry.subject_name) {
            row.push(`${entry.subject_name}\n${entry.teacher_name || ''}`);
          } else {
            row.push('-');
          }
        }
      }
      
      rows.push(row);
    }

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Save file
    const fileName = `${cls.name.replace(/\s+/g, '_')}_Timetable.pdf`;
    const filePath = path.join(app.getPath('downloads'), fileName);
    doc.save(filePath);

    return filePath;
  }

  /**
   * Export all class timetables to PDF
   */
  exportAllTimetablesPDF(doc) {
    const settings = this.dbService.getGlobalSettings();
    const classes = this.dbService.getClasses();
    const timetable = this.dbService.getTimetable();

    classes.forEach((cls, index) => {
      if (index > 0) {
        doc.addPage();
      }

      const classTimetable = timetable.filter(entry => entry.class_id === cls.id);

      // Title
      doc.setFontSize(16);
      doc.text(`Timetable - ${cls.name}`, 14, 15);

      // Prepare table data
      const headers = [['Hour', ...Array.from({ length: settings.numDayOrders }, (_, i) => `Day ${i + 1}`)]];
      const rows = [];

      for (let hour = 1; hour <= settings.hoursPerDay; hour++) {
        const row = [`Hour ${hour}`];
        
        if (settings.breakHours.includes(hour)) {
          for (let day = 1; day <= settings.numDayOrders; day++) {
            row.push('BREAK');
          }
        } else {
          for (let day = 1; day <= settings.numDayOrders; day++) {
            const entry = classTimetable.find(e => e.day_order === day && e.hour === hour);
            if (entry && entry.subject_name) {
              row.push(`${entry.subject_name}\n${entry.teacher_name || ''}`);
            } else {
              row.push('-');
            }
          }
        }
        
        rows.push(row);
      }

      doc.autoTable({
        head: headers,
        body: rows,
        startY: 25,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    });

    // Save file
    const fileName = 'All_Timetables.pdf';
    const filePath = path.join(app.getPath('downloads'), fileName);
    doc.save(filePath);

    return filePath;
  }

  /**
   * Export teacher workload to PDF
   */
  exportTeacherWorkloadPDF(doc) {
    const TimetableGenerator = require('../core/TimetableGenerator');
    const generator = new TimetableGenerator(this.dbService);
    const workload = generator.getTeacherWorkload();
    const settings = this.dbService.getGlobalSettings();

    // Title
    doc.setFontSize(16);
    doc.text('Teacher Workload Report', 14, 15);

    // Prepare table data
    const headers = [['Teacher', 'Weekly Hours', ...Array.from({ length: settings.numDayOrders }, (_, i) => `Day ${i + 1}`), 'Subjects']];
    const rows = [];

    workload.forEach(w => {
      const row = [
        w.teacherName,
        w.weeklyHours.toString()
      ];
      
      for (let day = 1; day <= settings.numDayOrders; day++) {
        row.push((w.dailyHours[day] || 0).toString());
      }
      
      row.push(w.subjects.join(', '));
      rows.push(row);
    });

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Save file
    const fileName = 'Teacher_Workload.pdf';
    const filePath = path.join(app.getPath('downloads'), fileName);
    doc.save(filePath);

    return filePath;
  }

  /**
   * Export to Excel
   */
  async exportToExcel(type, classId) {
    if (type === 'class-timetable') {
      return this.exportClassTimetableExcel(classId);
    } else if (type === 'all-timetables') {
      return this.exportAllTimetablesExcel();
    } else if (type === 'teacher-workload') {
      return this.exportTeacherWorkloadExcel();
    }
  }

  /**
   * Export class timetable to Excel
   */
  exportClassTimetableExcel(classId) {
    const settings = this.dbService.getGlobalSettings();
    const classes = this.dbService.getClasses();
    const cls = classes.find(c => c.id === classId);
    const timetable = this.dbService.getTimetable();
    const classTimetable = timetable.filter(entry => entry.class_id === classId);

    // Prepare data
    const data = [['Hour', ...Array.from({ length: settings.numDayOrders }, (_, i) => `Day ${i + 1}`)]];

    for (let hour = 1; hour <= settings.hoursPerDay; hour++) {
      const row = [`Hour ${hour}`];
      
      if (settings.breakHours.includes(hour)) {
        for (let day = 1; day <= settings.numDayOrders; day++) {
          row.push('BREAK');
        }
      } else {
        for (let day = 1; day <= settings.numDayOrders; day++) {
          const entry = classTimetable.find(e => e.day_order === day && e.hour === hour);
          if (entry && entry.subject_name) {
            row.push(`${entry.subject_name} (${entry.teacher_name || ''})`);
          } else {
            row.push('-');
          }
        }
      }
      
      data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, cls.name.substring(0, 31));

    const fileName = `${cls.name.replace(/\s+/g, '_')}_Timetable.xlsx`;
    const filePath = path.join(app.getPath('downloads'), fileName);
    XLSX.writeFile(wb, filePath);

    return filePath;
  }

  /**
   * Export all timetables to Excel
   */
  exportAllTimetablesExcel() {
    const settings = this.dbService.getGlobalSettings();
    const classes = this.dbService.getClasses();
    const timetable = this.dbService.getTimetable();
    const wb = XLSX.utils.book_new();

    classes.forEach(cls => {
      const classTimetable = timetable.filter(entry => entry.class_id === cls.id);

      const data = [['Hour', ...Array.from({ length: settings.numDayOrders }, (_, i) => `Day ${i + 1}`)]];

      for (let hour = 1; hour <= settings.hoursPerDay; hour++) {
        const row = [`Hour ${hour}`];
        
        if (settings.breakHours.includes(hour)) {
          for (let day = 1; day <= settings.numDayOrders; day++) {
            row.push('BREAK');
          }
        } else {
          for (let day = 1; day <= settings.numDayOrders; day++) {
            const entry = classTimetable.find(e => e.day_order === day && e.hour === hour);
            if (entry && entry.subject_name) {
              row.push(`${entry.subject_name} (${entry.teacher_name || ''})`);
            } else {
              row.push('-');
            }
          }
        }
        
        data.push(row);
      }

      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, cls.name.substring(0, 31));
    });

    const fileName = 'All_Timetables.xlsx';
    const filePath = path.join(app.getPath('downloads'), fileName);
    XLSX.writeFile(wb, filePath);

    return filePath;
  }

  /**
   * Export teacher workload to Excel
   */
  exportTeacherWorkloadExcel() {
    const TimetableGenerator = require('../core/TimetableGenerator');
    const generator = new TimetableGenerator(this.dbService);
    const workload = generator.getTeacherWorkload();
    const settings = this.dbService.getGlobalSettings();

    const data = [['Teacher', 'Weekly Hours', ...Array.from({ length: settings.numDayOrders }, (_, i) => `Day ${i + 1}`), 'Subjects']];

    workload.forEach(w => {
      const row = [w.teacherName, w.weeklyHours];
      for (let day = 1; day <= settings.numDayOrders; day++) {
        row.push(w.dailyHours[day] || 0);
      }
      row.push(w.subjects.join(', '));
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teacher Workload');

    const fileName = 'Teacher_Workload.xlsx';
    const filePath = path.join(app.getPath('downloads'), fileName);
    XLSX.writeFile(wb, filePath);

    return filePath;
  }
}

module.exports = ExportService;
