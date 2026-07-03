import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import FinderPage from './pages/FinderPage'
import ClassTimetablePage from './pages/ClassTimetablePage'
import AdminPage from './pages/AdminPage'
import TeacherStatusPage from './pages/TeacherStatusPage'
import ProfilePage from './pages/ProfilePage'
import AIAssistantWidget from './components/AIAssistantWidget'
import SendiYouPage from './pages/SendiYouPage'
import PostDetailPage from './pages/PostDetailPage'
import ChatPage from './pages/ChatPage'
import MessagesPage from './pages/MessagesPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-darker">
      <Navbar />
      <AIAssistantWidget />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/finder" element={<FinderPage />} />
          <Route path="/classes" element={<ClassTimetablePage />} />
          <Route path="/teachers" element={<TeacherStatusPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sendiyou" element={<ProtectedRoute><SendiYouPage /></ProtectedRoute>} />
          <Route path="/sendiyou/post/:postId" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
          <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
