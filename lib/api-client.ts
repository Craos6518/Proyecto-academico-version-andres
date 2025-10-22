"use client"

import {
  mockUsers,
  mockSubjects,
  mockGrades,
  mockAssignments,
  mockEnrollments,
  type User,
  type Subject,
  type Grade,
  type Assignment,
  type Enrollment,
} from "./mock-data"

// Simulated API client with storage adapter (memory or localStorage)
const STORAGE_PREFIX = "academic_"
import { storage } from "./storage"

class ApiClient {
  // Helper to get data from localStorage or use mock data
  private getData<T>(key: string, defaultData: T[]): T[] {
    const stored = storage.getItem(STORAGE_PREFIX + key)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return defaultData
      }
    }
    return defaultData
  }

  private setData<T>(key: string, data: T[]): void {
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
  }

  // Users
  getUsers(): User[] {
    return this.getData("users", mockUsers)
  }

  getUserById(id: number): User | undefined {
    return this.getUsers().find((u) => u.id === id)
  }

  createUser(user: Omit<User, "id">): User {
    const users = this.getUsers()
    const newUser = { ...user, id: Math.max(...users.map((u) => u.id), 0) + 1 }
    this.setData("users", [...users, newUser])
    return newUser
  }

  updateUser(id: number, updates: Partial<User>): User | null {
    const users = this.getUsers()
    const index = users.findIndex((u) => u.id === id)
    if (index === -1) return null

    users[index] = { ...users[index], ...updates }
    this.setData("users", users)
    return users[index]
  }

  updateUserPassword(id: number, newPassword: string): boolean {
    const users = this.getUsers()
    const index = users.findIndex((u) => u.id === id)
    if (index === -1) return false

    users[index] = { ...users[index], password: newPassword }
    this.setData("users", users)
    return true
  }

  deleteUser(id: number): boolean {
    const users = this.getUsers()
    const filtered = users.filter((u) => u.id !== id)
    if (filtered.length === users.length) return false

    this.setData("users", filtered)
    return true
  }

  // Subjects
  getSubjects(): Subject[] {
    return this.getData("subjects", mockSubjects)
  }

  getSubjectById(id: number): Subject | undefined {
    return this.getSubjects().find((s) => s.id === id)
  }

  getSubjectsByTeacher(teacherId: number): Subject[] {
    return this.getSubjects().filter((s) => s.teacherId === teacherId)
  }

  createSubject(subject: Omit<Subject, "id">): Subject {
    const subjects = this.getSubjects()
    const newSubject = { ...subject, id: Math.max(...subjects.map((s) => s.id), 0) + 1 }
    this.setData("subjects", [...subjects, newSubject])
    return newSubject
  }

  updateSubject(id: number, updates: Partial<Subject>): Subject | null {
    const subjects = this.getSubjects()
    const index = subjects.findIndex((s) => s.id === id)
    if (index === -1) return null

    subjects[index] = { ...subjects[index], ...updates }
    this.setData("subjects", subjects)
    return subjects[index]
  }

  deleteSubject(id: number): boolean {
    const subjects = this.getSubjects()
    const filtered = subjects.filter((s) => s.id !== id)
    if (filtered.length === subjects.length) return false

    this.setData("subjects", filtered)
    return true
  }

  // Enrollments
  getEnrollments(): Enrollment[] {
    return this.getData("enrollments", mockEnrollments)
  }

  getEnrollmentsByStudent(studentId: number): Enrollment[] {
    return this.getEnrollments().filter((e) => e.studentId === studentId)
  }

  getEnrollmentsBySubject(subjectId: number): Enrollment[] {
    return this.getEnrollments().filter((e) => e.subjectId === subjectId)
  }

  createEnrollment(enrollment: Omit<Enrollment, "id">): Enrollment {
    const enrollments = this.getEnrollments()
    const newEnrollment = { ...enrollment, id: Math.max(...enrollments.map((e) => e.id), 0) + 1 }
    this.setData("enrollments", [...enrollments, newEnrollment])
    return newEnrollment
  }

  updateEnrollment(id: number, updates: Partial<Enrollment>): Enrollment | null {
    const enrollments = this.getEnrollments()
    const index = enrollments.findIndex((e) => e.id === id)
    if (index === -1) return null

    enrollments[index] = { ...enrollments[index], ...updates }
    this.setData("enrollments", enrollments)
    return enrollments[index]
  }

  deleteEnrollment(id: number): boolean {
    const enrollments = this.getEnrollments()
    const filtered = enrollments.filter((e) => e.id !== id)
    if (filtered.length === enrollments.length) return false

    this.setData("enrollments", filtered)
    return true
  }

  // Assignments
  getAssignments(): Assignment[] {
    return this.getData("assignments", mockAssignments)
  }

  getAssignmentsBySubject(subjectId: number): Assignment[] {
    return this.getAssignments().filter((a) => a.subjectId === subjectId)
  }

  createAssignment(assignment: Omit<Assignment, "id">): Assignment {
    const assignments = this.getAssignments()
    const newAssignment = { ...assignment, id: Math.max(...assignments.map((a) => a.id), 0) + 1 }
    this.setData("assignments", [...assignments, newAssignment])
    return newAssignment
  }

  updateAssignment(id: number, updates: Partial<Assignment>): Assignment | null {
    const assignments = this.getAssignments()
    const index = assignments.findIndex((a) => a.id === id)
    if (index === -1) return null

    assignments[index] = { ...assignments[index], ...updates }
    this.setData("assignments", assignments)
    return assignments[index]
  }

  deleteAssignment(id: number): boolean {
    const assignments = this.getAssignments()
    const filtered = assignments.filter((a) => a.id !== id)
    if (filtered.length === assignments.length) return false

    this.setData("assignments", filtered)
    return true
  }

  // Grades
  getGrades(): Grade[] {
    return this.getData("grades", mockGrades)
  }

  getGradesByStudent(studentId: number): Grade[] {
    return this.getGrades().filter((g) => g.studentId === studentId)
  }

  getGradesBySubject(subjectId: number): Grade[] {
    return this.getGrades().filter((g) => g.subjectId === subjectId)
  }

  getGradesByStudentAndSubject(studentId: number, subjectId: number): Grade[] {
    return this.getGrades().filter((g) => g.studentId === studentId && g.subjectId === subjectId)
  }

  createGrade(grade: Omit<Grade, "id">): Grade {
    const grades = this.getGrades()
    const newGrade = {
      ...grade,
      id: Math.max(...grades.map((g) => g.id), 0) + 1,
      gradedAt: new Date().toISOString(),
    }
    this.setData("grades", [...grades, newGrade])
    return newGrade
  }

  updateGrade(id: number, updates: Partial<Grade>): Grade | null {
    const grades = this.getGrades()
    const index = grades.findIndex((g) => g.id === id)
    if (index === -1) return null

    grades[index] = { ...grades[index], ...updates }
    this.setData("grades", grades)
    return grades[index]
  }

  deleteGrade(id: number): boolean {
    const grades = this.getGrades()
    const filtered = grades.filter((g) => g.id !== id)
    if (filtered.length === grades.length) return false

    this.setData("grades", filtered)
    return true
  }

  // Calculate final grade for a student in a subject
  calculateFinalGrade(studentId: number, subjectId: number): number | null {
    const grades = this.getGradesByStudentAndSubject(studentId, subjectId)
    const assignments = this.getAssignmentsBySubject(subjectId)

    if (grades.length === 0) return null

    let totalWeightedScore = 0
    let totalWeight = 0

    for (const grade of grades) {
      const assignment = assignments.find((a) => a.id === grade.assignmentId)
      if (assignment) {
        totalWeightedScore += (grade.score * assignment.weight) / 100
        totalWeight += assignment.weight
      }
    }

    return totalWeight > 0 ? totalWeightedScore : null
  }
}

export const apiClient = new ApiClient()
