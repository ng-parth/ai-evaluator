
# AI Excel Processor - Full Setup Guide

Welcome! This project lets you:

- Upload an Excel file containing student answers
- Choose an AI Agent (OpenAI, Perplexity AI, DeepSeek AI)
- Provide API Key dynamically
- Automatically generate feedback and scores
- Download the processed Excel file

---

## Project Structure

```
ai-excel-processor/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── uploads/
│   └── processed/
└── frontend/
    └── react-app/
        ├── src/
        │   └── App.jsx
        ├── public/
        └── package.json (auto-generated when you create-react-app)
```

---

## 1. Prerequisites

- Node.js and npm installed
- An OpenAI / Perplexity / DeepSeek **API key** (depending on which AI you want to use)

---

## 2. Backend Setup (Express Server)

1. Open a terminal.

2. Navigate to the backend folder:

```bash
cd backend
```

3. Install dependencies:

```bash
npm install
```

4. Start the backend server:

```bash
npm start
```

Server will run on:

```
http://localhost:3000
```

---

## 3. Frontend Setup (React App)

1. Open another terminal.

2. Navigate to the frontend folder:

```bash
cd frontend/react-app
```

3. If you don't have React installed yet, create the react app:

```bash
npx create-react-app .
```

4. Install Axios for API requests:

```bash
npm install axios
```

5. Replace the `src/App.jsx` file with the provided one (already included).

6. Start the React frontend:

```bash
npm start
```

Frontend will run on:

```
http://localhost:3001
```

(If it asks for port change, say YES.)

---

## 4. How to Use

- Open the frontend in your browser.
- Upload the Excel file.
- Select the AI Agent.
- Enter your API Key.
- Submit to process.
- Download the updated Excel!

---

## 5. Notes

- **No paid account?** You can use DeepSeek or Perplexity AI (if they allow free API keys).
- Excel must have the following expected format:
    - Question at `K1`
    - Student answers in Column `K`
    - Model answers in Column `P`
    - Rubrics in Column `Q`
    - Feedback will be written to Column `M`
    - Scores will be written to Column `R`

---

## 6. Troubleshooting

- Make sure backend is running before submitting.
- Use correct API keys.
- Check console logs for errors.

---

## 7. To-Do / Future Improvements

- Support multiple questions at once.
- Allow custom prompt templates.
- Add better error handling.
- UI enhancements.

---

## Author

Built with ❤️ by ChatGPT for your automation needs!

Happy Processing! 🚀


# AI Excel Processor - Full Setup Guide

Welcome! This project lets you:
- Upload an Excel file containing student answers
- Choose an AI Agent (OpenAI, Perplexity AI, DeepSeek AI)
- Provide API Key dynamically
- Automatically generate feedback and scores
- Download the processed Excel file

(... and rest of content generated earlier ...)
