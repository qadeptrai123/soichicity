import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";

import LoginForm from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Feed from "./pages/Feed";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";

import Layout from "./components/layout/Layout";

export default function App() {
  return (
    <BrowserRouter>
      {/* 🔔 GLOBAL TOAST – chỉ 1 lần duy nhất */}
      <Toaster
        position="top-center"
        richColors
        closeButton={false}
        duration={2500}
        toastOptions={{
          className: "rounded-xl text-sm",
        }}
      />

      <Routes>
        {/* AUTH ROUTES */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* APP ROUTES */}
        <Route element={<Layout />}>
          <Route index element={<Feed />} />
          <Route path="post/:id" element={<PostDetail />} />
          <Route path="search" element={<div className="text-white">Search</div>} />
          <Route path="favorites" element={<div className="text-white">Favorites</div>} />
          <Route path="community" element={<div className="text-white">Community</div>} />
          <Route path="create" element={<div className="text-white">Create</div>} />
          <Route path="profile/:username" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
