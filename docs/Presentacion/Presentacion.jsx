import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Database, Shield, Code, Users, CheckCircle, GitBranch, Activity, Layout, Target } from 'lucide-react';

const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const slides = [
    // Slide 1: Portada
    {
      title: "Proyecto Académico",
      subtitle: "Sistema de Gestión de Notas",
      type: "cover",
      content: {
        team: [
          { name: "Presentador A (Andrés)", role: "Contexto y Estado" },
          { name: "Presentador B (Dev Lead)", role: "Arquitectura" },
          { name: "Presentador C (QA/UX)", role: "UI/UX y Métricas" }
        ]
      }
    },
    // Slide 2: Problema y Alcance
    {
      title: "Problema y Alcance",
      icon: Target,
      type: "content",
      content: {
        points: [
          "Sistema fiable para gestión de calificaciones por rol",
          "Usuarios: Admin, Director, Profesor, Estudiante",
          "Funcionalidades: CRUD users/subjects, inscripciones, grades, reportes"
        ]
      }
    },
    // Slide 3: Estado y Logros
    {
      title: "Estado y Logros",
      icon: CheckCircle,
      type: "achievements",
      content: {
        achievements: [
          { title: "Migración Supabase", desc: "Clientes anon/admin implementados" },
          { title: "Endpoints Seguros", desc: "/api/admin/*, /api/teacher/*, /api/student/*" },
          { title: "Auth Mejorada", desc: "Cookie HttpOnly academic_auth_token" }
        ]
      }
    },
    // Slide 4: Arquitectura
    {
      title: "Arquitectura Técnica",
      icon: Code,
      type: "architecture",
      content: {
        layers: [
          { name: "Frontend", tech: "Next.js + TypeScript + Tailwind", color: "from-blue-500 to-cyan-500" },
          { name: "Backend/BD", tech: "Supabase (Postgres + Auth)", color: "from-green-500 to-emerald-500" },
          { name: "Scripts", tech: "/scripts para esquema y seed", color: "from-purple-500 to-pink-500" }
        ]
      }
    },
    // Slide 5: Migraciones
    {
      title: "Migraciones de Base de Datos",
      icon: Database,
      type: "migration",
      content: {
        scripts: [
          "03-supabase-schema.sql",
          "04-supabase-seed.sql",
          "05-migrate-id-to-identity.sql"
        ],
        risk: "id sin autoincrement → fallbacks temporales (max(id)+1)",
        mitigation: "Ejecutar en staging con backup completo"
      }
    },
    // Slide 6: Endpoints Seguros
    {
      title: "Endpoints Protegidos",
      icon: Shield,
      type: "endpoints",
      content: {
        endpoints: [
          { path: "/api/admin/users", role: "Admin", color: "red" },
          { path: "/api/teacher/grades", role: "Teacher", color: "blue" },
          { path: "/api/student/secure-data", role: "Student", color: "green" }
        ],
        policy: "Protección por rol (JWT cookie HttpOnly)"
      }
    },
    // Slide 7: Seguridad
    {
      title: "Seguridad & Pruebas",
      icon: Shield,
      type: "security",
      content: {
        measures: [
          "Eliminar token en body del login",
          "Tests e2e para login + cookies",
          "CI para build + lint + tests"
        ]
      }
    },
    // Slide 8: UI/UX
    {
      title: "UI/UX y Responsive",
      icon: Layout,
      type: "uiux",
      content: {
        fixes: [
          "Sidebar colapsable y adaptativo",
          "Max-width en cards para legibilidad",
          "Inputs accesibles (<1024px)",
          "Charts responsivos"
        ]
      }
    },
    // Slide 9: Métricas
    {
      title: "Evidencia y Métricas",
      icon: Activity,
      type: "metrics",
      content: {
        artifacts: [
          "Logs y resultados de tests",
          "Reportes de CI y PRs",
          "Consultas BD para métricas internas"
        ]
      }
    },
    // Slide 10: Roadmap
    {
      title: "Roadmap y Próximos Pasos",
      icon: GitBranch,
      type: "roadmap",
      content: {
        priorities: [
          { level: "P1", task: "Ejecutar migración 05 en staging", status: "pending" },
          { level: "P2", task: "Eliminar /api/auth/set-token", status: "pending" },
          { level: "P3", task: "Añadir tests automáticos", status: "pending" },
          { level: "P4", task: "Exportar métricas y reportes", status: "pending" },
          { level: "P5", task: "QA visual con datos reales", status: "pending" }
        ]
      }
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(currentSlide + 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(currentSlide - 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, isAnimating]);

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-sm font-medium">Proyecto Académico - Sistema de Gestión de Notas</div>
          <div className="text-sm text-gray-400">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className={`w-full max-w-6xl transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          
          {/* Cover Slide */}
          {slide.type === "cover" && (
            <div className="text-center space-y-12 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                  {slide.title}
                </h1>
                <p className="text-3xl text-gray-300">{slide.subtitle}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                {slide.content.team.map((member, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Users size={32} />
                    </div>
                    <h3 className="font-bold text-xl mb-2">{member.name}</h3>
                    <p className="text-gray-400">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Slide */}
          {slide.type === "content" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                {Icon && <Icon size={48} className="text-blue-400" />}
                <h2 className="text-5xl font-bold">{slide.title}</h2>
              </div>
              <div className="space-y-6">
                {slide.content.points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 animate-slide-up" style={{animationDelay: `${idx * 0.1}s`}}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-sm font-bold">{idx + 1}</span>
                    </div>
                    <p className="text-2xl text-gray-200">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Slide */}
          {slide.type === "achievements" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                {Icon && <Icon size={48} className="text-green-400" />}
                <h2 className="text-5xl font-bold">{slide.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {slide.content.achievements.map((achievement, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-8 border border-green-400/30 hover:scale-105 transition-all duration-300 animate-slide-up" style={{animationDelay: `${idx * 0.15}s`}}>
                    <CheckCircle size={40} className="text-green-400 mb-4" />
                    <h3 className="text-2xl font-bold mb-3">{achievement.title}</h3>
                    <p className="text-gray-300 text-lg">{achievement.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture Slide */}
          {slide.type === "architecture" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                {Icon && <Icon size={48} className="text-cyan-400" />}
                <h2 className="text-5xl font-bold">{slide.title}</h2>
              </div>
              <div className="space-y-6">
                {slide.content.layers.map((layer, idx) => (
                  <div key={idx} className="animate-slide-right" style={{animationDelay: `${idx * 0.2}s`}}>
                    <div className={`bg-gradient-to-r ${layer.color} p-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105`}>
                      <h3 className="text-3xl font-bold mb-2">{layer.name}</h3>
                      <p className="text-xl text-white/90">{layer.tech}</p>
                    </div>
                    {idx < slide.content.layers.length - 1 && (
                      <div className="flex justify-center my-4">
                        <div className="w-1 h-12 bg-gradient-to-b from-white to-transparent"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Migration Slide */}
          {slide.type === "migration" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                {Icon && <Icon size={48} className="text-purple-400" />}
                <h2 className="text-5xl font-bold">{slide.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {slide.content.scripts.map((script, idx) => (
                  <div key={idx} className="bg-purple-500/20 backdrop-blur-md rounded-xl p-4 border border-purple-400/30 font-mono text-sm hover:bg-purple-500/30 transition-all animate-slide-up" style={{animationDelay: `${idx * 0.1}s`}}>
                    {script}
                  </div>
                ))}
              </div>
              <div className="bg-red-500/10 border-l-4 border-red-500 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-red-400 mb-2">⚠️ Riesgo</h3>
                <p className="text-xl text-gray-300">{slide.content.risk}</p>
              </div>
              <div className="bg-green-500/10 border-l-4 border-green-500 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-green-400 mb-2">✓ Mitigación</h3>
                <p className="text-xl text-gray-300">{slide.content.mitigation}</p>
              </div>
            </div>
          )}

          {/* Endpoints Slide */}
          {slide.type === "endpoints" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                {Icon && <Icon size={48} className="text-yellow-400" />}
                <h2 className="text-5xl font-bold">{slide.title}</h2>
              </div>
              <div className="space-y-4">
                {slide.content.endpoints.map((endpoint, idx) => (
                  <div key={idx} className={`bg-${endpoint.color}-500/20 backdrop-blur-md rounded-xl p-6 border border-${endpoint.color}-400/30 hover:scale-105 transition-all animate-slide-left`} style={{animationDelay: `${idx * 0.15}s`}}>
                    <div className="flex items-center justify-between">
                      <code className="text-2xl font-mono">{endpoint.path}</code>
                      <span className={`px-4 py-2 rounded-full bg-${endpoint.color}-500 text-white font-bold`}>
                        {endpoint.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mt-8">
                <p className="text-xl text-gray-300"><strong>Política:</strong> {slide.content.policy}</p>
              </div>
            </div>
          )}

          {/* Security, UI/UX, Metrics Slides */}
          {(slide.type === "security" || slide.type === "uiux" || slide.type === "metrics") && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                {Icon && <Icon size={48} className="text-orange-400" />}
                <h2 className="text-5xl font-bold">{slide.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(slide.content.measures || slide.content.fixes || slide.content.artifacts).map((item, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all animate-slide-up" style={{animationDelay: `${idx * 0.1}s`}}>
                    <div className="flex items-start gap-4">
                      <CheckCircle size={24} className="text-green-400 flex-shrink-0 mt-1" />
                      <p className="text-xl text-gray-200">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roadmap Slide */}
          {slide.type === "roadmap" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-8">
                {Icon && <Icon size={48} className="text-pink-400" />}
                <h2 className="text-5xl font-bold">{slide.title}</h2>
              </div>
              <div className="space-y-4">
                {slide.content.priorities.map((priority, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all animate-slide-right" style={{animationDelay: `${idx * 0.1}s`}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 font-bold text-xl">
                          {priority.level}
                        </span>
                        <span className="text-xl text-gray-200">{priority.task}</span>
                      </div>
                      <span className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
                        Pendiente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-12 text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ¿Preguntas?
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Navigation */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>
          
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentSlide(idx);
                    setTimeout(() => setIsAnimating(false), 500);
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
          >
            Siguiente
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-right {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-left {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; opacity: 0; }
        .animate-slide-right { animation: slide-right 0.6s ease-out forwards; opacity: 0; }
        .animate-slide-left { animation: slide-left 0.6s ease-out forwards; opacity: 0; }
      `}</style>
    </div>
  );
};

export default Presentation;