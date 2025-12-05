import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Feed from "./pages/Feed";
// import CreatePostDialog from './components/CreatePostDialog';

import { useState } from 'react';
import CreatePostDialog from '@/components/CreatePostDialog'; 
import { CURRENT_USER, MOCK_FRIENDS } from "@/MockData/data";

export default function App() {
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<LoginForm />} />
          <Route path='/register' element={<Register />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          <Route path='/' element={<Feed />} />
        </Routes>
      </BrowserRouter>

      <CreatePostDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        currentUser={CURRENT_USER} 
        mockFriends={MOCK_FRIENDS} 
        onPost={(content, mediaFiles) => {
          console.log("Đã gửi bài đăng với nội dung:", content, "và media:", mediaFiles);
          setIsDialogOpen(false); 
        }}
      />
    </>
  );
}


