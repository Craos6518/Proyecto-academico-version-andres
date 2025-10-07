"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { BarChart3, PieChart, TrendingUp, Users } from "lucide-react"

interface AnalyticsData {
  totalGrades: number
  excellentGrades: number // >= 4.5
  goodGrades: number // 4.0-4.4
  satisfactoryGrades: number // 3.0-3.9
  failingGrades: number // < 3.0
  averageByType: {
    parcial1: number
    parcial2: number
    final: number
  }
}

export function PerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalGrades: 0,
    excellentGrades: 0,
    goodGrades: 0,
    satisfactoryGrades: 0,
    failingGrades: 0,
    averageByType: {
      parcial1: 0,
      parcial2: 0,
      final: 0,
    },
  })

  useEffect(() => {
    const grades = apiClient.getGrades()
    const assignments = apiClient.getAssignments()

    const excellent = grades.filter((g) => g.score >= 4.5).length
    const good = grades.filter((g) => g.score >= 4.0 && g.score < 4.5).length
    const satisfactory = grades.filter((g) => g.score >= 3.0 && g.score < 4.0).length
    const failing = grades.filter((g) => g.score < 3.0).length

    // Calculate average by assignment type
    const parcial1Grades = grades.filter((g) => {
      const assignment = assignments.find((a) => a.id === g.assignmentId)
      return assignment?.assignmentType === "parcial1"
    })
    const parcial2Grades = grades.filter((g) => {
      const assignment = assignments.find((a) => a.id === g.assignmentId)
      return assignment?.assignmentType === "parcial2"
    })
    const finalGrades = grades.filter((g) => {
      const assignment = assignments.find((a) => a.id === g.assignmentId)
      return assignment?.assignmentType === "final"
    })

    const avgParcial1 =
      parcial1Grades.length > 0
        ? Math.round((parcial1Grades.reduce((sum, g) => sum + g.score, 0) / parcial1Grades.length) * 10) / 10
        : 0

    const avgParcial2 =
      parcial2Grades.length > 0
        ? Math.round((parcial2Grades.reduce((sum, g) => sum + g.score, 0) / parcial2Grades.length) * 10) / 10
        : 0

    const avgFinal =
      finalGrades.length > 0
        ? Math.round((finalGrades.reduce((sum, g) => sum + g.score, 0) / finalGrades.length) * 10) / 10
        : 0

    setAnalytics({
      totalGrades: grades.length,
      excellentGrades: excellent,
      goodGrades: good,
      satisfactoryGrades: satisfactory,
      failingGrades: failing,
      averageByType: {
        parcial1: avgParcial1,
        parcial2: avgParcial2,
        final: avgFinal,
      },
    })
  }, [])

  const getPercentage = (value: number) => {
    return analytics.totalGrades > 0 ? Math.round((value / analytics.totalGrades) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Distribución de Calificaciones
          </CardTitle>
          <CardDescription>Análisis de la distribución de calificaciones en la institución</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Excelente (4.5-5.0)</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{analytics.excellentGrades}</div>
              <div className="text-xs text-green-700 mt-1">{getPercentage(analytics.excellentGrades)}% del total</div>
            </div>

            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Bueno (4.0-4.4)</span>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{analytics.goodGrades}</div>
              <div className="text-xs text-blue-700 mt-1">{getPercentage(analytics.goodGrades)}% del total</div>
            </div>

            <div className="border rounded-lg p-4 bg-yellow-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-900">Satisfactorio (3.0-3.9)</span>
                <Users className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{analytics.satisfactoryGrades}</div>
              <div className="text-xs text-yellow-700 mt-1">
                {getPercentage(analytics.satisfactoryGrades)}% del total
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900">Reprobado (&lt;3.0)</span>
                <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
              </div>
              <div className="text-2xl font-bold text-red-600">{analytics.failingGrades}</div>
              <div className="text-xs text-red-700 mt-1">{getPercentage(analytics.failingGrades)}% del total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average by Evaluation Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Promedio por Tipo de Evaluación
          </CardTitle>
          <CardDescription>Comparación del rendimiento en diferentes tipos de evaluaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Parcial 1 (30%)</div>
              <div
                className={`text-4xl font-bold mb-2 ${analytics.averageByType.parcial1 >= 3.0 ? "text-green-600" : "text-red-600"}`}
              >
                {analytics.averageByType.parcial1 > 0 ? analytics.averageByType.parcial1 : "-"}
              </div>
              <div className="text-xs text-muted-foreground">Promedio institucional</div>
            </div>

            <div className="border rounded-lg p-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Parcial 2 (30%)</div>
              <div
                className={`text-4xl font-bold mb-2 ${analytics.averageByType.parcial2 >= 3.0 ? "text-green-600" : "text-red-600"}`}
              >
                {analytics.averageByType.parcial2 > 0 ? analytics.averageByType.parcial2 : "-"}
              </div>
              <div className="text-xs text-muted-foreground">Promedio institucional</div>
            </div>

            <div className="border rounded-lg p-6 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">Final (40%)</div>
              <div
                className={`text-4xl font-bold mb-2 ${analytics.averageByType.final >= 3.0 ? "text-green-600" : "text-red-600"}`}
              >
                {analytics.averageByType.final > 0 ? analytics.averageByType.final : "-"}
              </div>
              <div className="text-xs text-muted-foreground">Promedio institucional</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Resumen de Análisis</h3>
              <p className="text-sm text-blue-800">
                Se han registrado un total de <strong>{analytics.totalGrades} calificaciones</strong> en el sistema. La
                tasa de aprobación general es de{" "}
                <strong>
                  {getPercentage(analytics.excellentGrades + analytics.goodGrades + analytics.satisfactoryGrades)}%
                </strong>
                , con un {getPercentage(analytics.excellentGrades)}% de estudiantes con calificaciones excelentes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
