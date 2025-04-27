import React, { useState } from 'react';
import axios from 'axios';
import { showToast } from './Toast';

export default function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [apiKey, setApiKey] = useState('sk-54e380418269488f8475a25ea6797c56');
  const [aiAgent, setAiAgent] = useState('deepseek');
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
      link.setAttribute('download', 'processed_file.xlsx');
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
          <label className="block mb-2 text-sm font-semibold text-gray-700">Upload Excel File (.xlsx only):</label>
          <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="w-full"
          />
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
