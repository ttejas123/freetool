import { 
  Ruler, 
  Weight, 
  Thermometer, 
  Square, 
  Beaker, 
  Gauge, 
  HardDrive, 
  Clock, 
  Zap, 
  CircleDot, 
  Fuel,
  type LucideIcon 
} from 'lucide-react';

// Unit definitions for the full unit converter.
// Each unit has: id, label, toBase (convert to SI base), fromBase (convert from SI base).
// Temperature uses function-based conversion instead of linear factors.

export type UnitDef = {
  id: string;
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
};

export type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
  units: UnitDef[];
};

const linear = (factor: number): Pick<UnitDef, 'toBase' | 'fromBase'> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

export const categories: Category[] = [
  {
    id: 'length',
    label: 'Length',
    icon: Ruler,
    units: [
      { id: 'mm',  label: 'Millimetre (mm)',    ...linear(0.001) },
      { id: 'cm',  label: 'Centimetre (cm)',     ...linear(0.01) },
      { id: 'm',   label: 'Metre (m)',            ...linear(1) },
      { id: 'km',  label: 'Kilometre (km)',       ...linear(1000) },
      { id: 'in',  label: 'Inch (in)',            ...linear(0.0254) },
      { id: 'ft',  label: 'Foot (ft)',            ...linear(0.3048) },
      { id: 'yd',  label: 'Yard (yd)',            ...linear(0.9144) },
      { id: 'mi',  label: 'Mile (mi)',            ...linear(1609.344) },
      { id: 'nmi', label: 'Nautical Mile (nmi)',  ...linear(1852) },
      { id: 'um',  label: 'Micrometre (μm)',      ...linear(0.000001) },
      { id: 'nm',  label: 'Nanometre (nm)',       ...linear(0.000000001) },
      { id: 'ly',  label: 'Light Year (ly)',      ...linear(9.461e15) },
    ],
  },
  {
    id: 'mass',
    label: 'Mass',
    icon: Weight,
    units: [
      { id: 'mg',  label: 'Milligram (mg)',  ...linear(0.000001) },
      { id: 'g',   label: 'Gram (g)',        ...linear(0.001) },
      { id: 'kg',  label: 'Kilogram (kg)',   ...linear(1) },
      { id: 't',   label: 'Tonne (t)',       ...linear(1000) },
      { id: 'oz',  label: 'Ounce (oz)',      ...linear(0.0283495) },
      { id: 'lb',  label: 'Pound (lb)',      ...linear(0.453592) },
      { id: 'st',  label: 'Stone (st)',      ...linear(6.35029) },
      { id: 'lt',  label: 'Long Ton (lt)',   ...linear(1016.05) },
      { id: 'st2', label: 'Short Ton (tn)', ...linear(907.185) },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    icon: Thermometer,
    units: [
      {
        id: 'c',  label: '°Celsius (°C)',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: 'f',  label: '°Fahrenheit (°F)',
        toBase: (v) => (v - 32) * 5 / 9,
        fromBase: (v) => v * 9 / 5 + 32,
      },
      {
        id: 'k',  label: 'Kelvin (K)',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
      {
        id: 'r',  label: 'Rankine (R)',
        toBase: (v) => (v - 491.67) * 5 / 9,
        fromBase: (v) => (v + 273.15) * 9 / 5,
      },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    icon: Square,
    units: [
      { id: 'mm2',  label: 'mm²',         ...linear(0.000001) },
      { id: 'cm2',  label: 'cm²',         ...linear(0.0001) },
      { id: 'm2',   label: 'm²',          ...linear(1) },
      { id: 'km2',  label: 'km²',         ...linear(1e6) },
      { id: 'ha',   label: 'Hectare (ha)',...linear(10000) },
      { id: 'acre', label: 'Acre',         ...linear(4046.86) },
      { id: 'ft2',  label: 'ft²',         ...linear(0.092903) },
      { id: 'yd2',  label: 'yd²',         ...linear(0.836127) },
      { id: 'mi2',  label: 'mi²',         ...linear(2.59e6) },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    icon: Beaker,
    units: [
      { id: 'ml',   label: 'Millilitre (ml)',   ...linear(0.001) },
      { id: 'l',    label: 'Litre (L)',          ...linear(1) },
      { id: 'm3',   label: 'Cubic Metre (m³)',   ...linear(1000) },
      { id: 'floz', label: 'Fl Oz (US)',         ...linear(0.0295735) },
      { id: 'cup',  label: 'Cup (US)',           ...linear(0.236588) },
      { id: 'pt',   label: 'Pint (US)',          ...linear(0.473176) },
      { id: 'qt',   label: 'Quart (US)',         ...linear(0.946353) },
      { id: 'gal',  label: 'Gallon (US)',        ...linear(3.78541) },
      { id: 'igal', label: 'Gallon (UK)',        ...linear(4.54609) },
      { id: 'tsp',  label: 'Teaspoon',           ...linear(0.00492892) },
      { id: 'tbsp', label: 'Tablespoon',         ...linear(0.0147868) },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    icon: Gauge,
    units: [
      { id: 'ms',   label: 'm/s',          ...linear(1) },
      { id: 'kmh',  label: 'km/h',         ...linear(1 / 3.6) },
      { id: 'mph',  label: 'mph',          ...linear(0.44704) },
      { id: 'kn',   label: 'Knots (kn)',   ...linear(0.514444) },
      { id: 'ftps', label: 'ft/s',         ...linear(0.3048) },
      { id: 'mach', label: 'Mach (≈343m/s)', ...linear(343) },
      { id: 'c',    label: 'Speed of Light (c)', ...linear(299792458) },
    ],
  },
  {
    id: 'digital',
    label: 'Digital Storage',
    icon: HardDrive,
    units: [
      { id: 'bit',  label: 'Bit',          ...linear(1) },
      { id: 'byte', label: 'Byte (B)',      ...linear(8) },
      { id: 'kb',   label: 'Kilobyte (KB)',...linear(8 * 1024) },
      { id: 'mb',   label: 'Megabyte (MB)',...linear(8 * 1024 ** 2) },
      { id: 'gb',   label: 'Gigabyte (GB)',...linear(8 * 1024 ** 3) },
      { id: 'tb',   label: 'Terabyte (TB)',...linear(8 * 1024 ** 4) },
      { id: 'pb',   label: 'Petabyte (PB)',...linear(8 * 1024 ** 5) },
      { id: 'kib',  label: 'Kibibyte (KiB)',...linear(8 * 1024) },
      { id: 'mib',  label: 'Mebibyte (MiB)',...linear(8 * 1024 ** 2) },
      { id: 'gib',  label: 'Gibibyte (GiB)',...linear(8 * 1024 ** 3) },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    icon: Clock,
    units: [
      { id: 'ns',  label: 'Nanosecond (ns)',  ...linear(1e-9) },
      { id: 'us',  label: 'Microsecond (μs)', ...linear(1e-6) },
      { id: 'ms',  label: 'Millisecond (ms)', ...linear(0.001) },
      { id: 's',   label: 'Second (s)',        ...linear(1) },
      { id: 'min', label: 'Minute (min)',      ...linear(60) },
      { id: 'hr',  label: 'Hour (hr)',         ...linear(3600) },
      { id: 'day', label: 'Day',               ...linear(86400) },
      { id: 'wk',  label: 'Week',              ...linear(604800) },
      { id: 'mo',  label: 'Month (avg)',       ...linear(2629800) },
      { id: 'yr',  label: 'Year',              ...linear(31557600) },
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: Zap,
    units: [
      { id: 'j',    label: 'Joule (J)',         ...linear(1) },
      { id: 'kj',   label: 'Kilojoule (kJ)',    ...linear(1000) },
      { id: 'cal',  label: 'Calorie (cal)',      ...linear(4.184) },
      { id: 'kcal', label: 'Kilocalorie (kcal)',...linear(4184) },
      { id: 'wh',   label: 'Watt-hour (Wh)',    ...linear(3600) },
      { id: 'kwh',  label: 'kWh',               ...linear(3.6e6) },
      { id: 'btu',  label: 'BTU',               ...linear(1055.06) },
      { id: 'ev',   label: 'Electron-volt (eV)',...linear(1.602e-19) },
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure',
    icon: CircleDot,
    units: [
      { id: 'pa',   label: 'Pascal (Pa)',       ...linear(1) },
      { id: 'kpa',  label: 'Kilopascal (kPa)',  ...linear(1000) },
      { id: 'mpa',  label: 'Megapascal (MPa)',  ...linear(1e6) },
      { id: 'bar',  label: 'Bar',               ...linear(100000) },
      { id: 'psi',  label: 'PSI',               ...linear(6894.76) },
      { id: 'atm',  label: 'Atmosphere (atm)',  ...linear(101325) },
      { id: 'mmhg', label: 'mmHg (Torr)',       ...linear(133.322) },
      { id: 'inhg', label: 'inHg',              ...linear(3386.39) },
    ],
  },
  {
    id: 'fuel',
    label: 'Fuel Economy',
    icon: Fuel,
    units: [
      { id: 'mpg',    label: 'MPG (US)',         ...linear(1) },
      { id: 'mpg_uk', label: 'MPG (UK)',         ...linear(1 / 1.20095) },
      { id: 'kpl',    label: 'km/L',             ...linear(1 / 2.35215) },
      { id: 'l100km', label: 'L/100km',
        toBase: (v) => 235.215 / v,
        fromBase: (v) => 235.215 / v,
      },
    ],
  },
];

export function convert(value: number, fromUnit: UnitDef, toUnit: UnitDef): number {
  const base = fromUnit.toBase(value);
  return toUnit.fromBase(base);
}
