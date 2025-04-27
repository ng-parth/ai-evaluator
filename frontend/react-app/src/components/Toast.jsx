import React, { useState, useEffect } from 'react';

let showToastFunc;

export function showToast(message, type = 'success') {
  showToastFunc({ message, type });
}

export default function Toast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    showToastFunc = ({ message, type }) => {
      setToast({ visible: true, message, type });
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 3000);
    };
  }, []);

  if (!toast.visible) return null;

  return (
      <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
        {toast.message}
      </div>
  );
}
