// src/Routes.js
import { Routes, Route } from 'react-router-dom';
import Login from './components/login/Login';    
import Main from './components/main/Main';
import CUST0040 from './components/CUST/CUST0040';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/main" element={<Main />} />
      <Route path="/cust0040" element={<CUST0040 />} />
    </Routes>
  );
}

export default AppRoutes;