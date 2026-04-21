import { useState, useEffect } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { CopyButton } from '../../components/ui/CopyButton';
import { Button } from '../../components/ui/Button';

type FormatType = 'utc' | 'local' | 'iso' | 'unix';

interface TimeDuration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function TimestampConverter() {
  const [inputTs, setInputTs] = useState('');
  const [outputDate, setOutputDate] = useState('');
  const [currentTs, setCurrentTs] = useState(Math.floor(Date.now() / 1000));
  const [formatType, setFormatType] = useState<FormatType>('utc');
  const [showDiff, setShowDiff] = useState(false);
  const [ts2, setTs2] = useState('');
  const [diffResult, setDiffResult] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTs(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateDuration = (seconds: number): TimeDuration => {
    const absSeconds = Math.abs(seconds);
    const years = Math.floor(absSeconds / (365.25 * 24 * 3600));
    const months = Math.floor((absSeconds % (365.25 * 24 * 3600)) / (30.44 * 24 * 3600));
    const days = Math.floor((absSeconds % (30.44 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((absSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = Math.floor(absSeconds % 60);

    return { years, months, days, hours, minutes, seconds: secs };
  };

  const formatDate = (date: Date, format: FormatType): string => {
    switch (format) {
      case 'utc':
        return date.toUTCString();
      case 'local':
        return date.toString();
      case 'iso':
        return date.toISOString();
      case 'unix':
        return Math.floor(date.getTime() / 1000).toString();
      default:
        return '';
    }
  };

  const formatDurationString = (duration: TimeDuration, isNegative: boolean): string => {
    const parts: string[] = [];
    if (duration.years > 0) parts.push(`${duration.years} year${duration.years > 1 ? 's' : ''}`);
    if (duration.months > 0) parts.push(`${duration.months} month${duration.months > 1 ? 's' : ''}`);
    if (duration.days > 0) parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);
    if (duration.hours > 0) parts.push(`${duration.hours}h`);
    if (duration.minutes > 0) parts.push(`${duration.minutes}m`);
    if (duration.seconds > 0) parts.push(`${duration.seconds}s`);

    const timeStr = parts.slice(0, 3).join(', ') || '0s';
    return isNegative ? `${timeStr} ago` : `in ${timeStr}`;
  };

  useEffect(() => {
    if (!inputTs) {
      setOutputDate('');
      return;
    }
    const val = Number(inputTs);
    if (isNaN(val)) {
      setOutputDate('Invalid timestamp');
      return;
    }
    const isMillis = val > 1e11;
    const date = new Date(isMillis ? val : val * 1000);
    const timestamp = Math.floor(date.getTime() / 1000);
    const timeDiff = timestamp - currentTs;
    const duration = calculateDuration(timeDiff);
    const relativeTime = formatDurationString(duration, timeDiff < 0);

    const outputs = [
      `UTC:          ${formatDate(date, 'utc')}`,
      `Local:        ${formatDate(date, 'local')}`,
      `ISO 8601:     ${formatDate(date, 'iso')}`,
      `Unix (sec):   ${formatDate(date, 'unix')}`,
      `relative:     ${relativeTime}`,
    ];

    setOutputDate(outputs.join('\n'));
  }, [inputTs, currentTs]);

  useEffect(() => {
    if (!showDiff || !inputTs || !ts2) {
      setDiffResult('');
      return;
    }

    const val1 = Number(inputTs);
    const val2 = Number(ts2);

    if (isNaN(val1) || isNaN(val2)) {
      setDiffResult('Invalid timestamp');
      return;
    }

    const isMillis1 = val1 > 1e11;
    const isMillis2 = val2 > 1e11;
    const ts1Sec = isMillis1 ? Math.floor(val1 / 1000) : val1;
    const ts2Sec = isMillis2 ? Math.floor(val2 / 1000) : val2;

    const diff = ts2Sec - ts1Sec;
    const duration = calculateDuration(diff);
    const isNegative = diff < 0;

    const date1 = new Date(ts1Sec * 1000);
    const date2 = new Date(ts2Sec * 1000);

    const results = [
      `Timestamp 1:     ${formatDate(date1, 'utc')}`,
      `Timestamp 2:     ${formatDate(date2, 'utc')}`,
      ``,
      `Difference:      ${Math.abs(diff)} seconds`,
      `Formatted:       ${formatDurationString(duration, isNegative)}`,
      ``,
      `Breakdown:`,
      `  ${duration.years} years`,
      `  ${duration.months} months`,
      `  ${duration.days} days`,
      `  ${duration.hours} hours`,
      `  ${duration.minutes} minutes`,
      `  ${duration.seconds} seconds`,
    ];

    setDiffResult(results.join('\n'));
  }, [showDiff, inputTs, ts2]);

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet title="Timestamp to Date Converter" description="Convert Unix timestamps to dates and compare multiple timestamps." />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timestamp Converter</h1>
        <p className="mt-1 text-gray-500">Decode unix timestamps with multiple format options and compare timestamps.</p>
      </div>

      <div className="flex gap-4 items-center bg-brand-50 dark:bg-gray-800/50 p-4 rounded-xl border border-brand-100 dark:border-gray-700">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Current Epoch: </span>
        <span className="font-mono text-brand-600 dark:text-brand-400 text-lg">{currentTs}</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setInputTs(currentTs.toString())}>Use</Button>
          <CopyButton value={currentTs.toString()} size="sm" variant="secondary" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Single Timestamp Converter */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Convert Timestamp</h2>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unix Timestamp</label>
              <div className="flex gap-2">
                <Input
                  value={inputTs}
                  onChange={e => setInputTs(e.target.value)}
                  placeholder="e.g. 1711200000"
                  className="font-mono text-lg"
                />
                <Button onClick={() => setInputTs('')} variant="secondary">Clear</Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Output Formats</label>
                <div className="flex gap-2">
                  {(['utc', 'local', 'iso', 'unix'] as FormatType[]).map(fmt => (
                    <Button
                      key={fmt}
                      size="sm"
                      variant={formatType === fmt ? 'primary' : 'secondary'}
                      onClick={() => setFormatType(fmt)}
                      className="uppercase text-xs"
                    >
                      {fmt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">All Format Output</label>
                <CopyButton value={outputDate} variant="ghost" size="sm" />
              </div>
              <div className="min-h-[150px] p-4 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800">
                {outputDate || <span className="text-gray-400">Date will appear here...</span>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Timestamp Diff Calculator */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Compare Two Timestamps</h2>
              <Button
                size="sm"
                variant={showDiff ? 'primary' : 'secondary'}
                onClick={() => setShowDiff(!showDiff)}
              >
                {showDiff ? 'Hide' : 'Show'} Diff
              </Button>
            </div>

            {showDiff && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp 1</label>
                    <Input
                      value={inputTs}
                      onChange={e => setInputTs(e.target.value)}
                      placeholder="e.g. 1711200000"
                      className="font-mono text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp 2</label>
                    <Input
                      value={ts2}
                      onChange={e => setTs2(e.target.value)}
                      placeholder="e.g. 1711286400"
                      className="font-mono text-sm mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difference</label>
                    <CopyButton value={diffResult} variant="ghost" size="sm" />
                  </div>
                  <div className="min-h-[200px] p-4 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800">
                    {diffResult || <span className="text-gray-400">Difference will appear here...</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
