const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Global Settings
  saveGlobalSettings: (settings) => ipcRenderer.invoke('save-global-settings', settings),
  getGlobalSettings: () => ipcRenderer.invoke('get-global-settings'),
  
  // Classes
  saveClass: (classData) => ipcRenderer.invoke('save-class', classData),
  getClasses: () => ipcRenderer.invoke('get-classes'),
  deleteClass: (id) => ipcRenderer.invoke('delete-class', id),
  
  // Subjects
  saveSubject: (subjectData) => ipcRenderer.invoke('save-subject', subjectData),
  getSubjects: (classId) => ipcRenderer.invoke('get-subjects', classId),
  deleteSubject: (id) => ipcRenderer.invoke('delete-subject', id),
  
  // Teachers
  saveTeacher: (teacherData) => ipcRenderer.invoke('save-teacher', teacherData),
  getTeachers: () => ipcRenderer.invoke('get-teachers'),
  deleteTeacher: (id) => ipcRenderer.invoke('delete-teacher', id),
  
  // Allocations
  saveAllocation: (allocationData) => ipcRenderer.invoke('save-allocation', allocationData),
  getAllocations: () => ipcRenderer.invoke('get-allocations'),
  deleteAllocation: (id) => ipcRenderer.invoke('delete-allocation', id),
  
  // Timetable
  generateTimetable: () => ipcRenderer.invoke('generate-timetable'),
  getTimetable: () => ipcRenderer.invoke('get-timetable'),
  updateTimetableSlot: (slotData) => ipcRenderer.invoke('update-timetable-slot', slotData),
  getTeacherWorkload: () => ipcRenderer.invoke('get-teacher-workload'),
  
  // Export
  exportTimetable: (options) => ipcRenderer.invoke('export-timetable', options)
});
