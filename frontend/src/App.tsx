// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import './App.css'
// import LoginForm from './pages/Login'
// import ResetPassword from "./pages/ResetPassword";
// import Register from "./pages/Register";
// import ForgotPassword from "./pages/ForgotPassword";
// import CreatePostDialog from './components/CreatePostDialog';

// // function App() {
// //   return (
// //     <BrowserRouter>
// //       <Routes>
// //         <Route path='/' element={<LoginForm />} />
// //         <Route path='/register' element={<Register />} />
// //         <Route path='/forgot-password' element={<ForgotPassword />} />
// //         <Route path='/reset-password' element={<ResetPassword />} />
// //       </Routes>
// //     </BrowserRouter>
// //   )
// // }

import { useState } from "react";
import CreatePostDialog from "./components/CreatePostDialog";
import './App.css';

export default function App() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(true);

  return (
    <CreatePostDialog 
      open={isCreatePostOpen}
      onOpenChange={setIsCreatePostOpen}
    />
  );
}