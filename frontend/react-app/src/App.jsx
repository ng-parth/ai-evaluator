import React from 'react';
import FileUploadForm from './components/FileUploadForm';
import Toast from './components/Toast';

export default function App() {
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center justify-start py-12 px-4">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-indigo-700 drop-shadow-lg">AI Excel Processor</h1>
          <p className="mt-2 text-gray-600 text-center">Evaluate student answers using AI - OpenAI, Perplexity, DeepSeek</p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
          <FileUploadForm />
        </div>

        <Toast />
      </div>
  );
}
