import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginForm />} />
        <Route path='/reset-password' element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
