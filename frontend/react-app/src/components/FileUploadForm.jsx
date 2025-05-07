import React, { useState } from 'react';
import axios from 'axios';
import { showToast } from './Toast';

export default function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [apiKey, setApiKey] = useState('sk-54e380418269488f8475a25ea6797c56');
  const [aiAgent, setAiAgent] = useState('perplexity');
  const [isUploading, setIsUploading] = useState(false);

  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3500';
  // console.log('baseUrl: ', baseUrl);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !apiKey) {
      showToast('Please upload a file and enter an API key.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', apiKey);
    formData.append('aiAgent', aiAgent);

    try {
      setIsUploading(true);
      // const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/process-excel`, formData, {
      const response = await axios.post(`${baseUrl}/api/process-excel`, formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `processed_file_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast('File processed successfully! 🎉', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error processing file. Please check the API key or logs.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">Choose AI Agent:</label>
          <select
              value={aiAgent}
              onChange={(e) => setAiAgent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="openai">OpenAI</option>
            <option value="perplexity">Perplexity AI</option>
            <option value="deepseek">DeepSeek AI</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-gray-700">Enter API Key:</label>
          <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Your API Key"
          />
        </div>

        <div>
          <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-500 transition"
          >
            <svg
                className="w-10 h-10 text-blue-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M7 16V4m0 0L3 8m4-4l4 4M21 16v-1a4 4 0 00-3-3.87M17 16v1a4 4 0 01-4 4H5a4 4 0 01-4-4v-1a4 4 0 014-4h1">
              </path>
            </svg>
            <p className="text-gray-600 mb-1">{file ? file.name : "Click to choose file"}</p>
            <p className="text-sm text-gray-400">Only .xlsx files are allowed.<br/>(Drag-n-drop not allowed)</p>
            <input
                id="file-upload"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
            />
          </label>
        </div>

        <button
            type="submit"
            disabled={isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
        >
          {isUploading ? 'Processing...' : 'Upload and Process'}
        </button>
      </form>
  );
}
