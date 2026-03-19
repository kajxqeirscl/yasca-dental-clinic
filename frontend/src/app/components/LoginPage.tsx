import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: 'hekim' | 'asistan' | 'admin') => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo login - asistan rolü ile giriş
    onLogin('asistan');
  };

  const handleForgotPassword = () => {
    alert('Şifrenizi sıfırlamak için lütfen admin ile iletişime geçiniz.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">Y</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Yaşça Dental Klinik</CardTitle>
          <CardDescription>Hesabınıza giriş yapın</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Giriş Yap
            </Button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Şifremi Unuttum
            </button>
          </form>
          <div className="mt-6 p-3 bg-blue-50 rounded-md flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-900">
              Demo: Herhangi bir e-posta ve şifre ile giriş yapabilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
