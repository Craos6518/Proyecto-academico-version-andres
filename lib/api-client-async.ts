"use server"

import { supabaseApiClient } from "./supabase-api-client"

// Users
export async function getUsers() {
  return await supabaseApiClient.getUsers()
}

export async function getUserById(id: number) {
  return await supabaseApiClient.getUserById(id)
}

export async function createUser(u: any) {
  return await supabaseApiClient.createUser(u)
}

export async function updateUser(id: number, updates: any) {
  return await supabaseApiClient.updateUser(id, updates)
}

export async function deleteUser(id: number) {
  return await supabaseApiClient.deleteUser(id)
}

// Subjects
export async function getSubjects() {
  return await supabaseApiClient.getSubjects()
}

export async function getSubjectById(id: number) {
  return await supabaseApiClient.getSubjectById(id)
}

export async function getSubjectsByTeacher(teacherId: number) {
  return await supabaseApiClient.getSubjectsByTeacher(teacherId)
}

export async function createSubject(s: any) {
  return await supabaseApiClient.createSubject(s)
}

export async function updateSubject(id: number, updates: any) {
  return await supabaseApiClient.updateSubject(id, updates)
}

export async function deleteSubject(id: number) {
  return await supabaseApiClient.deleteSubject(id)
}

// Enrollments
export async function getEnrollments() {
  return await supabaseApiClient.getEnrollments()
}

export async function getEnrollmentsByStudent(studentId: number) {
  return await supabaseApiClient.getEnrollmentsByStudent(studentId)
}

export async function getEnrollmentsBySubject(subjectId: number) {
  return await supabaseApiClient.getEnrollmentsBySubject(subjectId)
}

export async function createEnrollment(e: any) {
  return await supabaseApiClient.createEnrollment(e)
}

export async function updateEnrollment(id: number, updates: any) {
  return await supabaseApiClient.updateEnrollment(id, updates)
}

export async function deleteEnrollment(id: number) {
  return await supabaseApiClient.deleteEnrollment(id)
}

// Assignments
export async function getAssignments() {
  return await supabaseApiClient.getAssignments()
}

export async function getAssignmentsBySubject(subjectId: number) {
  return await supabaseApiClient.getAssignmentsBySubject(subjectId)
}

export async function createAssignment(a: any) {
  return await supabaseApiClient.createAssignment(a)
}

export async function updateAssignment(id: number, updates: any) {
  return await supabaseApiClient.updateAssignment(id, updates)
}

export async function deleteAssignment(id: number) {
  return await supabaseApiClient.deleteAssignment(id)
}

// Grades
export async function getGrades() {
  return await supabaseApiClient.getGrades()
}

export async function getGradesByStudent(studentId: number) {
  return await supabaseApiClient.getGradesByStudent(studentId)
}

export async function getGradesBySubject(subjectId: number) {
  return await supabaseApiClient.getGradesBySubject(subjectId)
}

export async function getGradesByStudentAndSubject(studentId: number, subjectId: number) {
  return await supabaseApiClient.getGradesByStudentAndSubject(studentId, subjectId)
}

export async function createGrade(g: any) {
  return await supabaseApiClient.createGrade(g)
}

export async function updateGrade(id: number, updates: any) {
  return await supabaseApiClient.updateGrade(id, updates)
}

export async function deleteGrade(id: number) {
  return await supabaseApiClient.deleteGrade(id)
}

export async function calculateFinalGrade(studentId: number, subjectId: number) {
  return await supabaseApiClient.calculateFinalGrade(studentId, subjectId)
}

