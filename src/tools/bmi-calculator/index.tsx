'use client';

import { useState, useMemo } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Info, 
  ChevronRight,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Globe,
  Settings2
} from 'lucide-react';

// --- Constants & Types ---

type Unit = 'metric' | 'imperial';
type Goal = 'maintain' | 'lose' | 'gain';
type Formula = 'standard' | 'new';

interface BmiCategory {
  label: string;
  range: [number, number];
  color: string;
  message: string;
  suggestion: string;
  description: string;
}

const CATEGORIES: BmiCategory[] = [
  { 
    label: 'Underweight', 
    range: [0, 18.5], 
    color: 'text-blue-500 bg-blue-500', 
    message: 'You’re below the healthy range.',
    suggestion: 'Increase nutrient-dense calorie intake and consider strength training.',
    description: '< 18.5'
  },
  { 
    label: 'Normal', 
    range: [18.5, 24.9], 
    color: 'text-green-500 bg-green-500', 
    message: 'You’re in a healthy range.',
    suggestion: 'Maintain your current balanced diet and regular physical activity.',
    description: '18.5 – 24.9'
  },
  { 
    label: 'Overweight', 
    range: [25, 29.9], 
    color: 'text-yellow-500 bg-yellow-500', 
    message: 'You’re slightly overweight — small changes can help.',
    suggestion: 'Focus on reducing refined sugars and increasing daily step count.',
    description: '25.0 – 29.9'
  },
  { 
    label: 'Obese', 
    range: [30, 200], 
    color: 'text-red-500 bg-red-500', 
    message: 'Your BMI indicates obesity.',
    suggestion: 'Consult a health professional; prioritize portion control and cardio.',
    description: '> 30.0'
  }
];

const STATS = {
  global: 24.5,
  ideal: 22.0
};

// --- Helper Functions ---

const kgToLbs = (kg: number) => kg * 2.20462;
const lbsToKg = (lbs: number) => lbs / 2.20462;
const cmToInches = (cm: number) => cm / 2.54;
const inchesToCm = (inches: number) => inches * 2.54;

export default function BmiCalculator() {
  // --- State ---
  const [unit, setUnit] = useState<Unit>('metric');
  const [formula, setFormula] = useState<Formula>('standard');
  
  // Metric display states
  const [weightKg, setWeightKg] = useState<string>('');
  const [weightGr, setWeightGr] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  
  // Imperial display states
  const [weightLbs, setWeightLbs] = useState<string>('');
  const [heightFt, setHeightFt] = useState<string>('');
  const [heightIn, setHeightIn] = useState<string>('');
  
  const [goal, setGoal] = useState<Goal>('maintain');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  // --- Calculations ---

  const numericWeight = useMemo(() => {
    if (unit === 'metric') {
      const kg = parseFloat(weightKg) || 0;
      const gr = parseFloat(weightGr) || 0;
      return kg + (gr / 1000);
    } else {
      const lbs = parseFloat(weightLbs) || 0;
      return lbsToKg(lbs);
    }
  }, [unit, weightKg, weightGr, weightLbs]);

  const numericHeight = useMemo(() => {
    if (unit === 'metric') {
      return parseFloat(heightCm) || 0;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      return inchesToCm((ft * 12) + inch);
    }
  }, [unit, heightCm, heightFt, heightIn]);

  const bmiValue = useMemo(() => {
    if (numericWeight > 0 && numericHeight > 0) {
      const hMeters = numericHeight / 100;
      if (formula === 'standard') {
        return numericWeight / Math.pow(hMeters, 2);
      } else {
        // Nick Trefethen's New BMI Formula
        return 1.3 * numericWeight / Math.pow(hMeters, 2.5);
      }
    }
    return 0;
  }, [numericWeight, numericHeight, formula]);

  const currentCategory = useMemo(() => {
    if (bmiValue === 0) return CATEGORIES[1];
    return CATEGORIES.find(c => bmiValue >= c.range[0] && bmiValue <= c.range[1]) || (bmiValue > 30 ? CATEGORIES[3] : CATEGORIES[0]);
  }, [bmiValue]);

  const targetWeightKg = useMemo(() => {
    if (numericHeight > 0) {
      const hMeters = numericHeight / 100;
      if (formula === 'standard') {
        return STATS.ideal * Math.pow(hMeters, 2);
      } else {
        return (STATS.ideal * Math.pow(hMeters, 2.5)) / 1.3;
      }
    }
    return 0;
  }, [numericHeight, formula]);

  const weightDiff = Math.abs(numericWeight - targetWeightKg);

  // --- Handlers ---

  const handleUnitToggle = (newUnit: Unit) => {
    if (newUnit === unit) return;
    
    if (newUnit === 'metric') {
      // From Imperial to Metric
      const lbs = parseFloat(weightLbs) || 0;
      const ft = parseFloat(heightFt) || 0;
      const in_ = parseFloat(heightIn) || 0;
      
      const kgTotal = lbsToKg(lbs);
      setWeightKg(Math.floor(kgTotal).toString());
      setWeightGr(Math.round((kgTotal % 1) * 1000).toString());
      
      const cmTotal = inchesToCm((ft * 12) + in_);
      setHeightCm(cmTotal.toFixed(1));
    } else {
      // From Metric to Imperial
      const kg = parseFloat(weightKg) || 0;
      const gr = parseFloat(weightGr) || 0;
      const kgTotal = kg + (gr / 1000);
      setWeightLbs(kgToLbs(kgTotal).toFixed(1));
      
      const cm = parseFloat(heightCm) || 0;
      const totalInches = cmToInches(cm);
      setHeightFt(Math.floor(totalInches / 12).toString());
      setHeightIn(Math.round(totalInches % 12).toString());
    }
    setUnit(newUnit);
  };

  return (
    <div className="w-full mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      <SEOHelmet title="Advanced BMI Calculator" description="Compute your BMI, set goals, and get health insights with our visual tool." />
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          BMI <span className="text-brand-600">Calculator</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
          Choose your formula and get real-time health measurements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              
              {/* Formula & Unit Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Calculator Settings</span>
                </div>
                
                {/* Unit Toggle */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button 
                    onClick={() => handleUnitToggle('metric')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${unit === 'metric' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500'}`}
                  >
                    Metric (kg/cm)
                  </button>
                  <button 
                    onClick={() => handleUnitToggle('imperial')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${unit === 'imperial' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500'}`}
                  >
                    Imperial (lb/ft)
                  </button>
                </div>

                {/* Formula Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setFormula('standard')}
                    className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${formula === 'standard' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-gray-200 dark:border-gray-800 text-gray-400'}`}
                  >
                    Standard (WHO)
                  </button>
                  <button 
                    onClick={() => setFormula('new')}
                    className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${formula === 'new' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-gray-200 dark:border-gray-800 text-gray-400'}`}
                  >
                    New (Trefethen)
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                {unit === 'metric' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Weight</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <Input
                            type="number"
                            value={weightKg}
                            onChange={e => setWeightKg(e.target.value)}
                            placeholder="70"
                            className="h-14 text-xl font-bold pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">KG</span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            value={weightGr}
                            onChange={e => setWeightGr(e.target.value)}
                            placeholder="500"
                            className="h-14 text-xl font-bold pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">G</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Height (cm)</label>
                      <Input
                        type="number"
                        value={heightCm}
                        onChange={e => setHeightCm(e.target.value)}
                        placeholder="175"
                        className="h-14 text-xl font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Weight (lbs)</label>
                      <Input
                        type="number"
                        value={weightLbs}
                        onChange={e => setWeightLbs(e.target.value)}
                        placeholder="165"
                        className="h-14 text-xl font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Height (ft)</label>
                        <Input
                          type="number"
                          value={heightFt}
                          onChange={e => setHeightFt(e.target.value)}
                          placeholder="5"
                          className="h-14 text-xl font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Height (in)</label>
                        <Input
                          type="number"
                          value={heightIn}
                          onChange={e => setHeightIn(e.target.value)}
                          placeholder="9"
                          className="h-14 text-xl font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Age (optional)</label>
                    <Input
                      type="number"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Gender</label>
                    <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <button 
                        onClick={() => setGender('male')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${gender === 'male' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}
                      >
                        Male
                      </button>
                      <button 
                        onClick={() => setGender('female')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${gender === 'female' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400'}`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-500" />
                  Your Health Goal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['lose', 'maintain', 'gain'] as Goal[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        goal === g 
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10' 
                          : 'border-transparent bg-gray-50 dark:bg-gray-800 opacity-60'
                      }`}
                    >
                      {g === 'lose' && <TrendingDown className={`w-5 h-4 mb-1 ${goal === g ? 'text-brand-500' : ''}`} />}
                      {g === 'maintain' && <Minus className={`w-5 h-4 mb-1 ${goal === g ? 'text-brand-500' : ''}`} />}
                      {g === 'gain' && <TrendingUp className={`w-5 h-4 mb-1 ${goal === g ? 'text-brand-500' : ''}`} />}
                      <span className="text-[10px] uppercase font-black tracking-wider">{g}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results & Insights */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {bmiValue > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Main Score Card */}
                <Card className="bg-gradient-to-br from-brand-600 to-brand-800 text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-32 h-32" />
                  </div>
                  <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="text-center md:text-left flex-1 space-y-2">
                      <p className="text-brand-100 font-medium uppercase tracking-[0.2em] text-xs">Your Body Mass Index</p>
                      <h2 className="text-7xl font-black tracking-tighter">
                        {bmiValue.toFixed(1)}
                      </h2>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-md font-bold">
                        {currentCategory.label}
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-4">
                      <p className="text-lg font-medium text-brand-50 italic leading-snug">
                        "{currentCategory.message}"
                      </p>
                      <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-brand-200">
                          <Info className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Our Advice</span>
                        </div>
                        <p className="text-sm leading-relaxed">{currentCategory.suggestion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual Formula */}
                  <Card className="border-none shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <RefreshCcw className="w-3 h-3" />
                        Calculation
                      </h3>
                      <div className="flex flex-col items-center justify-center space-y-4 py-4">
                        <div className="text-center font-mono text-sm text-gray-400">
                          {formula === 'standard' ? 'BMI = W / H²' : 'BMI = 1.3 × W / H².⁵'}
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-1 text-sm font-semibold text-gray-600 dark:text-gray-400">
                          {formula === 'standard' ? (
                            <>
                              <span>{numericWeight.toFixed(2)}</span>
                              <span className="text-gray-300">/</span>
                              <span>({(numericHeight/100).toFixed(2)}²)</span>
                            </>
                          ) : (
                            <>
                              <span>1.3 × {numericWeight.toFixed(2)}</span>
                              <span className="text-gray-300">/</span>
                              <span>({(numericHeight/100).toFixed(2)}².⁵)</span>
                            </>
                          )}
                          <span className="text-brand-500 font-black ml-2">= {bmiValue.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparison Stats */}
                  <Card className="border-none shadow-lg bg-white dark:bg-gray-900">
                    <CardContent className="p-6">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ChevronRight className="w-3 h-3" />
                        Benchmarks
                      </h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Global Average', val: STATS.global, icon: <Globe className="w-4 h-4 text-blue-500" /> },
                          { label: 'Ideal (Standard)', val: STATS.ideal, icon: <Target className="w-4 h-4 text-brand-500" /> }
                        ].map((s) => (
                          <div key={s.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                {s.icon}
                              </div>
                              <span className="text-sm font-medium">{s.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black">{s.val}</span>
                              <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-500" 
                                  style={{ width: `${(s.val / 40) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* BMI Category Reference - HIGH VISIBILITY */}
                <div className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">BMI Category Reference</h3>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Standard Thresholds</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {CATEGORIES.map((c) => {
                      const isActive = currentCategory.label === c.label;
                      return (
                        <div 
                          key={c.label}
                          className={`relative p-4 rounded-2xl border-2 transition-all duration-500 ${
                            isActive 
                              ? `shadow-lg scale-105 z-10 ${c.color.split(' ')[1]} border-current` 
                              : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-60'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white dark:bg-gray-800 text-[10px] font-black rounded-full shadow-sm border border-current">
                              CURRENT
                            </div>
                          )}
                          <div className={`text-xs font-black uppercase mb-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {c.label}
                          </div>
                          <div className={`text-sm font-bold ${isActive ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                            {c.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Scale Gauge */}
                <Card className="border-none shadow-lg bg-white dark:bg-gray-900 overflow-visible">
                  <CardContent className="p-8">
                    <Gauge bmi={bmiValue} category={currentCategory} />
                  </CardContent>
                </Card>

                {/* Target Weight Card */}
                <Card className="border-none shadow-xl bg-brand-50 dark:bg-brand-950/20 border-l-4 border-l-brand-600">
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className="hidden sm:block bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
                      <Target className="w-10 h-10 text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">
                        Target: {unit === 'metric' ? `${targetWeightKg.toFixed(1)} kg` : `${kgToLbs(targetWeightKg).toFixed(1)} lbs`}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        To reach an ideal BMI of {STATS.ideal}, you {numericWeight > targetWeightKg ? 'should lose' : 'should gain'} 
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {' '}{unit === 'metric' ? `${weightDiff.toFixed(1)} kg` : `${kgToLbs(weightDiff).toFixed(1)} lbs`}
                        </span>.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6"
              >
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center animate-pulse">
                  <Activity className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold dark:text-white">Ready for calculation?</h3>
                  <p className="text-gray-500 max-w-sm mt-2">Enter your weight and height on the left to see your health dashboard.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Secure</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <AlertCircle className="w-5 h-5 text-brand-500 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Private</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- UI Components ---

const Gauge = ({ bmi, category }: { bmi: number; category: any }) => {
  const minBmi = 15;
  const maxBmi = 40;
  const clampedBmi = Math.min(Math.max(bmi, minBmi), maxBmi);
  const percentage = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;

  return (
    <div className="relative w-full h-12 mt-6 mb-10">
      <div className="absolute inset-0 flex rounded-full overflow-hidden shadow-inner h-4 top-4">
        <div className="h-full bg-blue-400" style={{ width: '14%' }}></div> {/* Underweight */}
        <div className="h-full bg-green-400" style={{ width: '25.6%' }}></div> {/* Normal */}
        <div className="h-full bg-yellow-400" style={{ width: '20%' }}></div> {/* Overweight */}
        <div className="h-full bg-red-400" style={{ width: '40.4%' }}></div> {/* Obese */}
      </div>
      <div className="absolute top-10 inset-0 flex justify-between text-[10px] font-medium text-gray-400 px-1">
        <span>15</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>40+</span>
      </div>
      <motion.div 
        className="absolute top-0 flex flex-col items-center"
        initial={false}
        animate={{ left: `${percentage}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        style={{ transform: 'translateX(-50%)' }}
      >
        <div className="bg-white dark:bg-gray-800 border-2 border-brand-500 rounded-full px-2 py-0.5 text-xs font-bold shadow-lg mb-1 text-gray-900 dark:text-white">
          {bmi > 0 ? bmi.toFixed(1) : '–'}
        </div>
        <div className="w-1 h-8 bg-brand-500 rounded-full shadow-sm"></div>
      </motion.div>
    </div>
  );
};
