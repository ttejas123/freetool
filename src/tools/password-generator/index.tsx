import { useState, useEffect, useCallback } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Toggle } from '../../components/ui/Toggle';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length > 8) score += 1;
    if (pwd.length > 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score < 3) return { label: 'Weak', color: 'bg-red-500' };
    if (score < 5) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const generatePassword = useCallback(() => {
    let charset = '';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (!charset) return setPassword('');
    let newPassword = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) newPassword += charset[array[i] % charset.length];
    setPassword(newPassword);
  }, [length, options]);

  useEffect(() => { generatePassword(); }, [generatePassword]);

  const strength = calculateStrength(password);

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet title="Secure Password Generator" description="Generate secure passwords with strength checker." />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Password Generator</h1>
        <p className="mt-2 text-gray-500 text-sm flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500"/> Local crypto generator.</p>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="relative group">
            <div className="flex items-center justify-between w-full p-4 md:p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors">
              <span className="text-2xl md:text-3xl font-mono text-gray-900 dark:text-gray-100 break-all pr-24">
                {password || 'Select options'}
              </span>
              <div className="absolute right-4 md:right-6 flex items-center gap-2">
                <Button onClick={generatePassword} variant="ghost" size="sm" className="px-2">
                  <RefreshCw className="w-5 h-5" />
                </Button>
                <CopyButton value={password} />
              </div>
            </div>
            
            {/* Strength Indicator */}
            {password && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 flex gap-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all w-1/3`} />
                  <div className={`h-full ${strength.color} transition-all w-1/3 ${strength.label === 'Weak' ? 'opacity-0' : 'opacity-100'}`} />
                  <div className={`h-full ${strength.color} transition-all w-1/3 ${strength.label !== 'Strong' ? 'opacity-0' : 'opacity-100'}`} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password Length: {length}</label>
              </div>
              <input
                type="range" min="4" max="64" value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-brand-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Toggle checked={options.uppercase} onChange={() => setOptions(p => ({...p, uppercase: !p.uppercase}))} label="Uppercase (A-Z)" />
              <Toggle checked={options.lowercase} onChange={() => setOptions(p => ({...p, lowercase: !p.lowercase}))} label="Lowercase (a-z)" />
              <Toggle checked={options.numbers} onChange={() => setOptions(p => ({...p, numbers: !p.numbers}))} label="Numbers (0-9)" />
              <Toggle checked={options.symbols} onChange={() => setOptions(p => ({...p, symbols: !p.symbols}))} label="Symbols (!@#$)" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
