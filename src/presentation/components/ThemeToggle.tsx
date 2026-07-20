import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/presentation/theme/ThemeProvider';
import { Button } from './ui/Button';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
