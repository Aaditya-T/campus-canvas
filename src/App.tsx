import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Chatrooms from "./pages/Chatrooms";
import ChatroomDetails from "./pages/ChatroomDetails";
import Confessions from "./pages/Confessions";
import Resources from "./pages/Resources";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import PostPage from "./pages/PostPage";
import VerificationUpload from "./pages/VerificationUpload";
import CheckEmail from "./pages/CheckEmail";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import VerificationPrompt from "./components/VerificationPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route 
              path="/verification" 
              element={
                <ProtectedRoute requireApproved={false}>
                  <VerificationUpload />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/feed" 
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/post/:postId" 
              element={
                <ProtectedRoute>
                  <PostPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chatrooms" 
              element={
                <ProtectedRoute>
                  <Chatrooms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chatrooms/:chatroomId" 
              element={
                <ProtectedRoute>
                  <ChatroomDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/confessions" 
              element={
                <ProtectedRoute>
                  <Confessions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resources" 
              element={
                <ProtectedRoute>
                  <Resources />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireApproved={false}>
                  <AdminDashboard />
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
            <Route path="/user/:username" element={<UserProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <VerificationPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
