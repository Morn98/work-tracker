import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Timer } from './pages/Timer';
import { Projects } from './pages/Projects';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
      </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
