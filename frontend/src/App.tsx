import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import './App.css'

import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import Feed from "./pages/Feed"
import PostDetail from "./pages/PostDetail"
import Profile from "./pages/Profile"
import Activity from "./pages/Activity"
import Search from "./pages/Search"

import Layout from './components/layout/Layout'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        richColors
        icons={{
          loading: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
        }}
        toastOptions={{
          style: {
            background: "#0A0E1A",
            color: "#ffffff",
            border: "1px solid #2A2F3E"
          }
        }}
      />
      <Routes>

        {/* AUTH ROUTES */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* APP ROUTES */}
        {/* Layout bọc các trang bên trong để hiển thị Sidebar/Topbar chung */}
        <Route element={<Layout />}>
          <Route index element={<Feed />} />
          <Route path="post/:id" element={<PostDetail />} />
          <Route path="search" element={<Search />} />
          <Route path="activities" element={<Activity />} />
          <Route path="community" element={<div className="text-white">Community</div>} />
          <Route path="create" element={<div className="text-white">Create</div>} />
          <Route path="profile/:username" element={<Profile />} />
        </Route>

      </Routes >
    </BrowserRouter >
  );
}