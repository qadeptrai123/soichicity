// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import './App.css'
// import LoginForm from './pages/Login'
// import ResetPassword from "./pages/ResetPassword";
// import Register from "./pages/Register";
// import ForgotPassword from "./pages/ForgotPassword";
// import Feed from "./pages/Feed";
// // import CreatePostDialog from './components/CreatePostDialog';


// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path='/login' element={<LoginForm />} />
//         <Route path='/register' element={<Register />} />
//         <Route path='/forgot-password' element={<ForgotPassword />} />
//         <Route path='/reset-password' element={<ResetPassword />} />
//         <Route path='/' element={<Feed />} />
//       </Routes>
//     </BrowserRouter>
//   )
// }

// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import './App.css'

// import LoginForm from './pages/Login'
// import ResetPassword from "./pages/ResetPassword"
// import Register from "./pages/Register"
// import ForgotPassword from "./pages/ForgotPassword"
// import Feed from "./pages/Feed"

// import Layout from './components/layout/Layout'
// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* QUAN TRỌNG: Route Layout bao bọc các Route con */}
//         <Route element={<Layout />}>
          
//           {/* path="/" chính là trang Feed sẽ hiện vào vị trí <Outlet /> */}
//           <Route path="/" element={<Feed />} />
          
//           {/* Các trang khác */}
//           <Route path="/search" element={<div className="text-white">Search</div>} />
//         </Route>

//         {/* Các route không có layout (Login/Register) để ra ngoài */}
//         <Route path="/login" element={<div>Login Page</div>} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import Feed from "./pages/Feed"

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
      <Route element={<Layout />}>
        <Route index element={<Feed />} />

        <Route path="search" element={<div className="text-white">Search</div>} />
        <Route path="favorites" element={<div className="text-white">Favorites</div>} />
        <Route path="community" element={<div className="text-white">Community</div>} />
        <Route path="create" element={<div className="text-white">Create</div>} />
      </Route>

    </Routes>
  </BrowserRouter>

  );
}
