import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import { CURRENT_USER, MOCK_FRIENDS, MOCK_TARGET_POST } from "@/MockData/data"; 
import Comment from './components/comment';
import CreatePostDialog from './components/CreatePostDialog';

import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import Feed from "./pages/Feed"
// 1. Import trang chi tiết (Bạn cần đảm bảo đã tạo file này ở bước trước)
import ThreadDetail from "./pages/ThreadDetail" 

import Layout from './components/layout/Layout'

// Test Component để test cả 2 dialogs
function TestDialogs() {
  const [openComment, setOpenComment] = useState(false);
  const [openCreatePost, setOpenCreatePost] = useState(false);

  const handlePost = (content: string, mediaFiles: any[]) => {
    console.log('Posted:', { content, mediaFiles });
  };

  return (
    <div className="min-h-screen bg-background text-white p-8 flex flex-col gap-4 items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Test Dialogs</h1>
      
      <button
        onClick={() => setOpenComment(true)}
        className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-semibold"
      >
        Open Comment Dialog
      </button>

      <button
        onClick={() => setOpenCreatePost(true)}
        className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold"
      >
        Open Create Post Dialog
      </button>

      <Comment
        open={openComment}
        onOpenChange={setOpenComment}
        currentUser={CURRENT_USER}
        targetPost={MOCK_TARGET_POST}
        mockFriends={MOCK_FRIENDS}
        onPost={handlePost}
      />

      <CreatePostDialog
        open={openCreatePost}
        onOpenChange={setOpenCreatePost}
        currentUser={CURRENT_USER}
        mockFriends={MOCK_FRIENDS}
        onPost={handlePost}
      />
    </div>
  );
}

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
          {/* :id là tham số động, ví dụ: /thread/123, /thread/abc */}
          <Route path="thread/:id" element={<ThreadDetail />} />

          <Route path="search" element={<div className="text-white">Search</div>} />
          <Route path="favorites" element={<div className="text-white">Favorites</div>} />
          <Route path="community" element={<div className="text-white">Community</div>} />
          <Route path="create" element={<div className="text-white">Create</div>} />
          
          {/* Test route for dialogs */}
          <Route path="test" element={<TestDialogs />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}