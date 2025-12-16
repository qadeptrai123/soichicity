import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
// import Comment from './components/comment';
// import CreatePostDialog from './components/CreatePostDialog';

import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import Feed from "./pages/Feed"
// 1. Import trang chi tiết (Bạn cần đảm bảo đã tạo file này ở bước trước)
import PostDetail from "./pages/PostDetail" 
// import Profile from "./pages/Profile"

import Layout from './components/layout/Layout'

export default function App() {
  return (
    <BrowserRouter>
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

          {/* 2. Thêm Route chi tiết bài viết */}
          {/* :id là tham số động, ví dụ: /post/123, /post/abc */}
          <Route path="post/:id" element={<PostDetail />} />

          <Route path="search" element={<div className="text-white">Search</div>} />
          <Route path="favorites" element={<div className="text-white">Favorites</div>} />
          <Route path="community" element={<div className="text-white">Community</div>} />
          <Route path="create" element={<div className="text-white">Create</div>} />
          {/* <Route path="profile" element={<Profile/>} /> */}
          {/* <Route path="profile/:id" element={<Profile/>} />   */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}