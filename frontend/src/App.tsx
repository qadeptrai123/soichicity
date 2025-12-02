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

// import { useState } from "react";
// import CreatePostDialog from "./components/CreatePostDialog";
// import './App.css';

// export default function App() {
//   const [isCreatePostOpen, setIsCreatePostOpen] = useState(true);

//   return (
//     <CreatePostDialog 
//       open={isCreatePostOpen}
//       onOpenChange={setIsCreatePostOpen}
//     />
//   );
// }


import { useState } from 'react';
import CreatePostDialog from '@/components/CreatePostDialog'; 
import { CURRENT_USER, MOCK_FRIENDS } from "@/MockData/data"; 
import './App.css'

export default function App() {
    
    const [isDialogOpen, setIsDialogOpen] = useState(true);

    return (
        // Chỉ trả về component Dialog duy nhất
        <CreatePostDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
            currentUser={CURRENT_USER} 
            mockFriends={MOCK_FRIENDS} 
            onPost={(content, mediaFiles) => {
                console.log("Đã gửi bài đăng với nội dung:", content, "và media:", mediaFiles);
                // setIsDialogOpen(false); 
            }}
        />
    );
}