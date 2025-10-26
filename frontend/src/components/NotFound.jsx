import React from 'react'
import { FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className='flex items-center justify-center flex-col m-4 lg:m-20 gap-3 text-center bg-gray-50 dark:bg-gray-900 min-h-screen'>
        <h2 className='text-6xl font-bold text-gray-900 dark:text-white'>404</h2>
        <div className='flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300'>
            <FaExclamationCircle/>
            <p> Oops! Page not found!</p>
        </div>
       
        <p className="text-gray-600 dark:text-gray-400">The page you requested was not found.</p>
        <button onClick={()=>navigate('/')} className='bg-primary-500 text-white py-2 px-3 rounded-full hover:bg-black dark:hover:bg-gray-800 transition-colors'>Back to Home</button>
    </div>
  )
}

export default NotFound