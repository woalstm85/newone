import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CommonCodeProvider } from './context/CommonCodeContext';
import { MenuProvider } from './context/MenuContext';
import Layout from './components/layout/Layout';
import Login from './components/login/Login';
import Modal from './components/common/Modal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // CSS import 추가

const DynamicRouteComponent = () => {
  const [Component, setComponent] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const loadComponent = async () => {
      if (location.pathname === '/') return;
      
      try {
        const path = location.pathname.slice(1);
        const module = await import(
          /* webpackChunkName: "[request]" */
          `./components/${path}`
        );
        setComponent(() => module.default);
      } catch (err) {
        setShowModal(true);
      }
    };

    loadComponent();
  }, [location.pathname]);

  if (!Component) return <div>로딩중...</div>;
  
  return (
    <>
      <Component key={location.pathname} />
      <Modal
        isOpen={showModal}
        title="안내"
        message="해당 페이지는 준비 중입니다."
        onConfirm={() => setShowModal(false)}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
        <MenuProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<Layout />}>
                <Route index element={<div>메인 페이지</div>} />
                <Route
                  path="*"
                  element={
                    <Suspense fallback={<div>로딩중...</div>}>
                      <DynamicRouteComponent />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
            {/* ToastContainer 추가 */}
            <ToastContainer 
              position="top-center"
              autoClose={500}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </BrowserRouter>
        </MenuProvider>
    </AuthProvider>
  );
}

export default App;