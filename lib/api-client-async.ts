"use server"

import { supabaseApiClient } from "./supabase-api-client"

export const apiClientAsync = {
  // Users
  getUsers: async () => await supabaseApiClient.getUsers(),
  getUserById: async (id: number) => await supabaseApiClient.getUserById(id),
  createUser: async (u: any) => await supabaseApiClient.createUser(u),
  updateUser: async (id: number, updates: any) => await supabaseApiClient.updateUser(id, updates),
  deleteUser: async (id: number) => await supabaseApiClient.deleteUser(id),

  // Subjects
  getSubjects: async () => await supabaseApiClient.getSubjects(),
  getSubjectById: async (id: number) => await supabaseApiClient.getSubjectById(id),
  getSubjectsByTeacher: async (teacherId: number) => await supabaseApiClient.getSubjectsByTeacher(teacherId),
  createSubject: async (s: any) => await supabaseApiClient.createSubject(s),
  updateSubject: async (id: number, updates: any) => await supabaseApiClient.updateSubject(id, updates),
  deleteSubject: async (id: number) => await supabaseApiClient.deleteSubject(id),

  // Enrollments
  getEnrollments: async () => await supabaseApiClient.getEnrollments(),
  getEnrollmentsByStudent: async (studentId: number) => await supabaseApiClient.getEnrollmentsByStudent(studentId),
  getEnrollmentsBySubject: async (subjectId: number) => await supabaseApiClient.getEnrollmentsBySubject(subjectId),
  createEnrollment: async (e: any) => await supabaseApiClient.createEnrollment(e),
  updateEnrollment: async (id: number, updates: any) => await supabaseApiClient.updateEnrollment(id, updates),
  deleteEnrollment: async (id: number) => await supabaseApiClient.deleteEnrollment(id),

  // Assignments
  getAssignments: async () => await supabaseApiClient.getAssignments(),
  getAssignmentsBySubject: async (subjectId: number) => await supabaseApiClient.getAssignmentsBySubject(subjectId),
  createAssignment: async (a: any) => await supabaseApiClient.createAssignment(a),
  updateAssignment: async (id: number, updates: any) => await supabaseApiClient.updateAssignment(id, updates),
  deleteAssignment: async (id: number) => await supabaseApiClient.deleteAssignment(id),

  // Grades
  getGrades: async () => await supabaseApiClient.getGrades(),
  getGradesByStudent: async (studentId: number) => await supabaseApiClient.getGradesByStudent(studentId),
  getGradesBySubject: async (subjectId: number) => await supabaseApiClient.getGradesBySubject(subjectId),
  getGradesByStudentAndSubject: async (studentId: number, subjectId: number) => await supabaseApiClient.getGradesByStudentAndSubject(studentId, subjectId),
  createGrade: async (g: any) => await supabaseApiClient.createGrade(g),
  updateGrade: async (id: number, updates: any) => await supabaseApiClient.updateGrade(id, updates),
  deleteGrade: async (id: number) => await supabaseApiClient.deleteGrade(id),

  calculateFinalGrade: async (studentId: number, subjectId: number) => await supabaseApiClient.calculateFinalGrade(studentId, subjectId),
}

export default apiClientAsync
