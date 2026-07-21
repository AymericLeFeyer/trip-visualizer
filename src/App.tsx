import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@/presentation/theme/ThemeProvider';
import { AdminModeProvider } from '@/presentation/mode/AdminModeProvider';
import { HomePage } from '@/presentation/pages/HomePage';
import { TripPage } from '@/presentation/pages/TripPage';

export function App() {
  return (
    <ThemeProvider>
      <AdminModeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/trip/:id" element={<TripPage />} />
          </Routes>
        </BrowserRouter>
      </AdminModeProvider>
    </ThemeProvider>
  );
}
