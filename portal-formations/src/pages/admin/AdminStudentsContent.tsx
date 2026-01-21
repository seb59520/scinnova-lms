import { Link } from 'react-router-dom'
import { GraduationCap, ArrowRight, BookOpen, Layers, Users } from 'lucide-react'

export function AdminStudentsContent() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Vue élèves
            </h3>
            <p className="text-slate-600 mb-4">
              Accédez à la vue que voient les élèves : leurs formations, programmes et projets à rendre.
              Cette vue vous permet de comprendre l'expérience utilisateur et de tester les fonctionnalités.
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Accéder à la vue élèves
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-slate-900">Formations</h4>
          </div>
          <p className="text-sm text-slate-600">
            Consultez toutes les formations disponibles, y compris celles que vous avez créées en tant qu'admin.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-slate-900">Programmes</h4>
          </div>
          <p className="text-sm text-slate-600">
            Découvrez les parcours de formation complets regroupant plusieurs formations.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-slate-900">Projets</h4>
          </div>
          <p className="text-sm text-slate-600">
            Visualisez les projets à rendre et suivez votre progression en tant qu'apprenant.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h4 className="font-semibold text-slate-900 mb-2">Note importante</h4>
        <p className="text-sm text-slate-600">
          En tant qu'administrateur, vous avez accès à toutes les formations et programmes dans la vue élèves.
          Utilisez cette vue pour tester l'expérience utilisateur et vérifier que tout fonctionne correctement.
        </p>
      </div>
    </div>
  )
}
