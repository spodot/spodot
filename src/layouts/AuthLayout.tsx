import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/spodot/logo/spodot.svg" alt="Spodot Logo" className="h-14 w-auto" />
          </div>
          <p className="text-slate-600 mt-2">
            스포닷 센터 관리 시스템
          </p>
        </div>
        
                  <div className="bg-white rounded-xl shadow-xl p-8 border border-slate-200">
          <Outlet />
        </div>
        
                  <p className="text-center text-slate-500 text-sm mt-8">
          © 2025 스포닷 센터 관리 시스템. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthLayout;