import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/useTheme";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminFaculty from "./pages/AdminFaculty";

import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminSettings from "./pages/AdminSettings";
import InstructorManageStudents from "./pages/InstructorManageStudents";
import InstructorSettings from "./pages/InstructorSettings";
import StudentSettings from "./pages/StudentSettings";
import StudentAnalytics from "./pages/StudentAnalytics";
import ModuleExploration from "./pages/ModuleExploration";
import Lab1Explore from "./pages/Lab1Explore";
import Lab2Explore from "./pages/Lab2Explore";
import ModulesList from "./pages/ModulesList";
import QuizSelection from "./pages/QuizSelection";
import QuizTaking from "./pages/QuizTaking";
import QuizResult from "./pages/QuizResult";
import TestModelPage from "./pages/testmodel";
import GuestLab from "./pages/GuestLab";
import CreateQuiz from "./pages/CreateQuiz";
import VRMTSModuleAssignment from "./pages/AssignModule";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vrmts-theme">
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<GuestLab />} />
          <Route path="/studentdashboard" element={<StudentDashboard />} />
          <Route path="/instructordashboard" element={<InstructorDashboard />} />
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/faculty" element={<AdminFaculty />} />

          <Route path="/admin/audit" element={<AdminAuditLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/instructor/students" element={<InstructorManageStudents />} />
          <Route path="/instructor/settings" element={<InstructorSettings />} />
          <Route path="/instructor/create-quiz" element={<CreateQuiz />} />
          <Route path="/settings" element={<StudentSettings />} />
          <Route path="/studentanalytics" element={<StudentAnalytics />} />
          <Route path="/instructor/modules" element={<VRMTSModuleAssignment />} />
          <Route path="/modules" element={<ModulesList />} />
          <Route path="/module/:id" element={<ModuleExploration />} />
          <Route path="/lab1explore" element={<Lab1Explore />} />
          <Route path="/lab2explore" element={<Lab2Explore />} />
          <Route path="/quizselection" element={<QuizSelection />} />
          <Route path="/quizattempt/:attemptId" element={<QuizTaking />} />
          <Route path="/quizresult/:attemptId" element={<QuizResult />} />
          <Route path="/testmodel" element={<TestModelPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
