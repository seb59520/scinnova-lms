import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { NetworkStatus } from './components/NetworkStatus'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { CourseView } from './pages/CourseView'
import { ProgramView } from './pages/ProgramView'
import { ItemView } from './pages/ItemView'
import { Help } from './pages/Help'
import { AdminCourses } from './pages/admin/AdminCourses'
import { AdminCourseEdit } from './pages/admin/AdminCourseEdit'
import { AdminCourseEditJson } from './pages/admin/AdminCourseEditJson'
import { AdminAICourseGenerator } from './pages/admin/AdminAICourseGenerator'
import { AdminCourseEnrollments } from './pages/admin/AdminCourseEnrollments'
import { AdminCourseSubmissions } from './pages/admin/AdminCourseSubmissions'
import { AdminTitanicSubmissions } from './pages/admin/AdminTitanicSubmissions'
import { AdminTitanicActions } from './pages/admin/AdminTitanicActions'
import { AdminItemEdit } from './pages/admin/AdminItemEdit'
import { AdminItemEditJson } from './pages/admin/AdminItemEditJson'
import { AdminChapterEditJson } from './pages/admin/AdminChapterEditJson'
import { AdminItems } from './pages/admin/AdminItems'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminUserEnrollments } from './pages/admin/AdminUserEnrollments'
import { AdminGhostCodes } from './pages/admin/AdminGhostCodes'
import { GhostLogin } from './pages/GhostLogin'
import { AdminOrgs } from './pages/admin/AdminOrgs'
import { AdminUnified } from './pages/admin/AdminUnified'
import { AdminPrograms } from './pages/admin/AdminPrograms'
import { AdminProgramEdit } from './pages/admin/AdminProgramEdit'
import { AdminProgramEnrollments } from './pages/admin/AdminProgramEnrollments'
import { AdminQuizResponses } from './pages/admin/AdminQuizResponses'
import { AdminTpBatchesList } from './pages/admin/AdminTpBatchesList'
import { AdminTpBatches } from './pages/admin/AdminTpBatches'
import { AdminCourseTpAssociations } from './pages/admin/AdminCourseTpAssociations'
import { AdminDocumentation } from './pages/admin/AdminDocumentation'
import { TrainerDashboard } from './pages/trainer/TrainerDashboard'
import { SessionLearners } from './pages/trainer/SessionLearners'
import { SessionAnalytics } from './pages/trainer/SessionAnalytics'
import { ExerciseResults } from './pages/trainer/ExerciseResults'
import { TrainerNotes } from './pages/trainer/TrainerNotes'
import { TrainerCourseScript } from './pages/trainer/TrainerCourseScript'
import { TrainerQuizResponses } from './pages/trainer/TrainerQuizResponses'
import { TrainerUseCaseAnalyses } from './pages/trainer/TrainerUseCaseAnalyses'
import { TrainerDataScienceExercises } from './pages/trainer/TrainerDataScienceExercises'
import { UserTimeTracking } from './pages/trainer/UserTimeTracking'
import { TrainerRouteGuard } from './components/trainer/TrainerRouteGuard'
// Nouvelles pages pour sessions synchronisées
import { SessionLive } from './pages/trainer/SessionLive'
import { SessionHub } from './pages/trainer/SessionHub'
import { TrainerGradebook } from './pages/trainer/TrainerGradebook'
import { LiveQuizControl } from './pages/trainer/LiveQuizControl'
import { SessionsManager } from './pages/trainer/SessionsManager'
import { ProjectsManager } from './pages/trainer/ProjectsManager'
import { ProjectEvaluation } from './pages/trainer/ProjectEvaluation'
import { ProjectTemplatesManager } from './pages/trainer/ProjectTemplatesManager'
import { AllProjectsOverview } from './pages/trainer/AllProjectsOverview'
import { LearnerGradebook } from './pages/LearnerGradebook'
import { LiveQuizPlay } from './pages/LiveQuizPlay'
import { ProjectSubmissionPage } from './pages/ProjectSubmissionPage'
import { Profile } from './pages/Profile'
import { DebugProfile } from './pages/DebugProfile'
import { DiagnosticRole } from './pages/DiagnosticRole'
import { PresentationView } from './pages/PresentationView'
import { LandingPage } from './pages/LandingPage'
import { LearnerMailbox } from './pages/LearnerMailbox'
import { Chat } from './pages/Chat'
import { UserDirectoryPage } from './pages/UserDirectoryPage'
import { ChatWidget } from './components/ChatWidget'
import { TimeTrackingProvider } from './components/TimeTrackingProvider'
import DataExercisesPage from './pages/DataExercisesPage'

function App() {
  return (
    <AuthProvider>
      <TimeTrackingProvider>
        <NetworkStatus />
        <div className="min-h-screen bg-gray-50 pt-24">
        <Routes>
          {/* Routes publiques */}
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute requireAuth={false}>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute requireAuth={false}>
                <ResetPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ghost-login"
            element={
              <ProtectedRoute requireAuth={false}>
                <GhostLogin />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées pour étudiants */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CourseView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programs/:programId"
            element={
              <ProtectedRoute>
                <ProgramView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:itemId"
            element={
              <ProtectedRoute>
                <ItemView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landing"
            element={
              <ProtectedRoute requireAuth={false}>
                <LandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercises-data"
            element={
              <ProtectedRoute>
                <DataExercisesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mailbox"
            element={
              <ProtectedRoute>
                <LearnerMailbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/directory"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserDirectoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug-profile"
            element={
              <ProtectedRoute>
                <DebugProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostic-role"
            element={
              <ProtectedRoute>
                <DiagnosticRole />
              </ProtectedRoute>
            }
          />
          <Route
            path="/presentation/:courseId"
            element={
              <ProtectedRoute>
                <PresentationView />
              </ProtectedRoute>
            }
          />

          {/* Routes admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUnified />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documentation"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDocumentation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/new/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/ai-generator"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAICourseGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/enrollments"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseEnrollments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/submissions"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseSubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/quiz-responses"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminQuizResponses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quiz-responses"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminQuizResponses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/titanic-submissions"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTitanicSubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/titanic-actions"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTitanicActions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItems />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items/:itemId/edit"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItemEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items/:itemId/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItemEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items/new/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminItemEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chapters/:chapterId/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminChapterEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chapters/new/json"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminChapterEditJson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:userId/enrollments"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUserEnrollments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ghost-codes"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminGhostCodes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orgs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminOrgs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPrograms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs/:programId"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProgramEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programs/:programId/enrollments"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProgramEnrollments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tp-batches"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTpBatchesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tp-batches/:batchId"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTpBatches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/tp-associations"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCourseTpAssociations />
              </ProtectedRoute>
            }
          />

          {/* Routes formateur */}
          <Route
            path="/trainer"
            element={
              <TrainerRouteGuard>
                <TrainerDashboard />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/sessions"
            element={
              <TrainerRouteGuard>
                <SessionsManager />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId"
            element={
              <TrainerRouteGuard>
                <SessionLearners />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/analytics/:sessionId"
            element={
              <TrainerRouteGuard>
                <SessionAnalytics />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId/exercise/:exerciseId/results"
            element={
              <TrainerRouteGuard>
                <ExerciseResults />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/notes"
            element={
              <TrainerRouteGuard>
                <TrainerNotes />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/courses/:courseId/script"
            element={
              <TrainerRouteGuard>
                <TrainerCourseScript />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/time-tracking"
            element={
              <TrainerRouteGuard>
                <UserTimeTracking />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/sessions/:sessionId/time-tracking"
            element={
              <TrainerRouteGuard>
                <UserTimeTracking />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/quiz-responses"
            element={
              <TrainerRouteGuard>
                <TrainerQuizResponses />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/courses/:courseId/quiz-responses"
            element={
              <TrainerRouteGuard>
                <TrainerQuizResponses />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/sessions/:sessionId/quiz-responses"
            element={
              <TrainerRouteGuard>
                <TrainerQuizResponses />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/use-case-analyses"
            element={
              <TrainerRouteGuard>
                <TrainerUseCaseAnalyses />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/courses/:courseId/use-case-analyses"
            element={
              <TrainerRouteGuard>
                <TrainerUseCaseAnalyses />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/sessions/:sessionId/use-case-analyses"
            element={
              <TrainerRouteGuard>
                <TrainerUseCaseAnalyses />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/data-science-exercises"
            element={
              <TrainerRouteGuard>
                <TrainerDataScienceExercises />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/courses/:courseId/data-science-exercises"
            element={
              <TrainerRouteGuard>
                <TrainerDataScienceExercises />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/sessions/:sessionId/data-science-exercises"
            element={
              <TrainerRouteGuard>
                <TrainerDataScienceExercises />
              </TrainerRouteGuard>
            }
          />
          
          {/* Routes Session (formateur) */}
          <Route
            path="/trainer/session/:sessionId"
            element={
              <TrainerRouteGuard>
                <SessionHub />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId/live"
            element={
              <TrainerRouteGuard>
                <SessionLive />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId/gradebook"
            element={
              <TrainerRouteGuard>
                <TrainerGradebook />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId/quiz/:activityId"
            element={
              <TrainerRouteGuard>
                <LiveQuizControl />
              </TrainerRouteGuard>
            }
          />
          
          {/* Routes formateur - Restitution de projet */}
          <Route
            path="/trainer/session/:sessionId/projects"
            element={
              <TrainerRouteGuard>
                <ProjectsManager />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/session/:sessionId/project/:restitutionId/evaluate"
            element={
              <TrainerRouteGuard>
                <ProjectEvaluation />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/project-templates"
            element={
              <TrainerRouteGuard>
                <ProjectTemplatesManager />
              </TrainerRouteGuard>
            }
          />
          <Route
            path="/trainer/projects"
            element={
              <TrainerRouteGuard>
                <AllProjectsOverview />
              </TrainerRouteGuard>
            }
          />

          {/* Routes apprenant - Sessions et Gradebook */}
          <Route
            path="/session/:sessionId/gradebook"
            element={
              <ProtectedRoute>
                <LearnerGradebook />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:sessionId/quiz/:activityId"
            element={
              <ProtectedRoute>
                <LiveQuizPlay />
              </ProtectedRoute>
            }
          />
          
          {/* Routes apprenant - Restitution de projet */}
          <Route
            path="/session/:sessionId/project/:restitutionId"
            element={
              <ProtectedRoute>
                <ProjectSubmissionPage />
              </ProtectedRoute>
            }
          />

          {/* Route par défaut - Landing Page */}
          <Route path="/" element={<ProtectedRoute requireAuth={false}><LandingPage /></ProtectedRoute>} />
        </Routes>
        {/* Widget de chat disponible partout */}
        <ChatWidget />
      </div>
      </TimeTrackingProvider>
    </AuthProvider>
  )
}

export default App
