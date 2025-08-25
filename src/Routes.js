// src/Routes.js
import { Routes, Route } from 'react-router-dom';
import Login from './components/login/Login';    
import Main from './components/main/Main';     

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/main" element={<Main />} />
    </Routes>
  );
}

export default AppRoutes;