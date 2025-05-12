import React, { useState } from 'react';
import axios from 'axios';
import { showToast } from './Toast';
import * as XLSX from "xlsx";
const ALL_SHEETS = "allSheets";

export default function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [apiKey, setApiKey] = useState('sk-54e380418269488f8475a25ea6797c56');
  const [aiAgent, setAiAgent] = useState('perplexity');
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(ALL_SHEETS);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3500';
  // console.log('baseUrl: ', baseUrl);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);

    // Read sheet names
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      setSheetNames(workbook.SheetNames);
      setSelectedSheet(ALL_SHEETS); // Reset selection
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !apiKey) {
      showToast('Please upload a file and/or enter an API key.', 'error');
      return;
    }
    if (selectedSheet === ALL_SHEETS) {
      setShowConfirmModal(true); // Show modal first
    } else {
      processFile(); // Process directly for single sheet
    }
  }
  const processFile = async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', apiKey);
    formData.append('aiAgent', aiAgent);
    formData.append("sheetName", selectedSheet);

    try {
      setIsUploading(true);
      setShowConfirmModal(false);
      const response = await axios.post(`${baseUrl}/api/process-excel`, formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let fileName = `processed_${file?.name}_${selectedSheet}`.replace(/[\W]+/g,"-");
      link.setAttribute('download', `${fileName}.xlsx`);
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
    <>
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
        {/* Sheet Dropdown */}
        {sheetNames.length > 0 && (
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Select sheet to process</label>
              <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value={ALL_SHEETS}>All Sheets</option>
                {sheetNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                ))}
              </select>
            </div>
        )}
        <button
            type="submit"
            disabled={isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
        >
          {isUploading ? 'Processing...' : 'Upload and Process'}
        </button>
      </form>
      {/* ⚠️ Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
              className="bg-white p-6 rounded-lg max-w-sm w-full space-y-4 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modalFade"
          >
            <h3 className="text-lg font-bold text-gray-800">Process All Sheets?</h3>
            <p className="text-gray-600">
              Processing all sheets may take more time and resources. Are you sure you want to continue?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                  onClick={processFile}
                  className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
