import { useState, useCallback, useMemo } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { categories, convert } from './units';
import type { UnitDef } from './units';


function UnitSelect({
  options, value, onChange,
}: { options: UnitDef[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
      >
        {options.map(u => (
          <option key={u.id} value={u.id}>{u.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
    </div>
  );
}

export default function UnitConverter() {
  const [categoryId, setCategoryId] = useState('length');
  const [fromId, setFromId] = useState('m');
  const [toId, setToId] = useState('ft');
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');

  const category = useMemo(() => categories.find(c => c.id === categoryId)!, [categoryId]);
  const fromUnit = useMemo(() => category.units.find(u => u.id === fromId) ?? category.units[0], [category, fromId]);
  const toUnit = useMemo(() => category.units.find(u => u.id === toId) ?? category.units[1], [category, toId]);

  const handleCategoryChange = useCallback((catId: string) => {
    const cat = categories.find(c => c.id === catId)!;
    setCategoryId(catId);
    setFromId(cat.units[0].id);
    setToId(cat.units[1]?.id ?? cat.units[0].id);
    setFromValue('1');
    setToValue('');
  }, []);

  const handleFromValue = useCallback((val: string) => {
    setFromValue(val);
    const num = parseFloat(val);
    if (!val || isNaN(num)) { setToValue(''); return; }
    const result = convert(num, fromUnit, toUnit);
    setToValue(isFinite(result) ? +result.toPrecision(10) + '' : '∞');
  }, [fromUnit, toUnit]);

  const handleToValue = useCallback((val: string) => {
    setToValue(val);
    const num = parseFloat(val);
    if (!val || isNaN(num)) { setFromValue(''); return; }
    const result = convert(num, toUnit, fromUnit);
    setFromValue(isFinite(result) ? +result.toPrecision(10) + '' : '∞');
  }, [fromUnit, toUnit]);

  const handleFromUnit = (id: string) => {
    setFromId(id);
    const newFrom = category.units.find(u => u.id === id)!;
    const num = parseFloat(fromValue);
    if (!isNaN(num)) {
      const result = convert(num, newFrom, toUnit);
      setToValue(isFinite(result) ? +result.toPrecision(10) + '' : '∞');
    }
  };

  const handleToUnit = (id: string) => {
    setToId(id);
    const newTo = category.units.find(u => u.id === id)!;
    const num = parseFloat(fromValue);
    if (!isNaN(num)) {
      const result = convert(num, fromUnit, newTo);
      setToValue(isFinite(result) ? +result.toPrecision(10) + '' : '∞');
    }
  };

  const swap = () => {
    const prevFromId = fromId;
    const prevToId = toId;
    const prevToValue = toValue;
    setFromId(prevToId);
    setToId(prevFromId);
    setFromValue(prevToValue);
    const num = parseFloat(prevToValue);
    const newFrom = category.units.find(u => u.id === prevToId)!;
    const newTo = category.units.find(u => u.id === prevFromId)!;
    if (!isNaN(num)) {
      const result = convert(num, newFrom, newTo);
      setToValue(isFinite(result) ? +result.toPrecision(10) + '' : '∞');
    }
  };

  // Quick reference: all units converted from current fromValue
  const allConversions = useMemo(() => {
    const num = parseFloat(fromValue);
    if (isNaN(num)) return [];
    return category.units
      .filter(u => u.id !== fromId)
      .map(u => {
        const result = convert(num, fromUnit, u);
        return { unit: u, result: isFinite(result) ? +result.toPrecision(8) : null };
      });
  }, [fromValue, fromUnit, fromId, category]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet
        title="Unit Converter — Length, Mass, Temperature, Speed & More"
        description="Convert between all major units: length, mass, temperature, volume, speed, digital storage, time, energy, pressure and fuel economy."
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unit Converter</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Convert across 11 categories and 80+ units instantly.</p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
              categoryId === cat.id
                ? 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-500/30'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-brand-400 hover:text-brand-600'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main converter card */}
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-end gap-4">
            {/* From */}
            <div className="flex-1 w-full space-y-2">
              <UnitSelect options={category.units} value={fromId} onChange={handleFromUnit} />
              <Input
                type="number"
                value={fromValue}
                onChange={e => handleFromValue(e.target.value)}
                placeholder="0"
                className="text-2xl md:text-3xl h-16 font-bold"
              />
            </div>

            {/* Swap button */}
            <button
              onClick={swap}
              className="mb-1 p-3 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-300 text-zinc-500 hover:text-brand-600 transition-all shrink-0 shadow-sm"
              title="Swap units"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>

            {/* To */}
            <div className="flex-1 w-full space-y-2">
              <UnitSelect options={category.units} value={toId} onChange={handleToUnit} />
              <Input
                type="number"
                value={toValue}
                onChange={e => handleToValue(e.target.value)}
                placeholder="0"
                className="text-2xl md:text-3xl h-16 font-bold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All conversions reference table */}
      {allConversions.length > 0 && fromValue && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              All {category.label} Conversions — from {fromValue} {fromUnit.label}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allConversions.map(({ unit, result }) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer transition-colors group"
                  onClick={() => { setToId(unit.id); setToValue(result !== null ? String(result) : ''); }}
                >
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate pr-2">
                    {unit.label}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">
                    {result !== null ? result.toLocaleString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
