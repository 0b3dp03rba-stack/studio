"use client";

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export default function Captcha({ onVerify }: CaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const generateChallenge = useCallback(() => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    setIsCorrect(false);
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    const correct = parseInt(val) === num1 + num2;
    setIsCorrect(correct);
    onVerify(correct);
  };

  return (
    <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <ShieldCheck size={14} /> Keamanan Sesi
        </label>
        <button 
          type="button"
          onClick={generateChallenge}
          className="text-white/30 hover:text-white transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1 h-12 flex items-center justify-center bg-black rounded-xl border border-white/5 font-black text-xl tracking-tighter text-white">
          {num1} + {num2} = ?
        </div>
        <Input 
          type="number"
          placeholder="Jawaban"
          value={userAnswer}
          onChange={handleChange}
          className={`w-28 h-12 bg-white/5 border-2 text-center font-black rounded-xl focus-visible:ring-0 transition-all ${
            userAnswer === '' ? 'border-white/10' : isCorrect ? 'border-green-500/50 text-green-500' : 'border-primary/50 text-primary'
          }`}
        />
      </div>
      <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest text-center">
        Selesaikan tantangan untuk mengaktifkan tombol
      </p>
    </div>
  );
}
