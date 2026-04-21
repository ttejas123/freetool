import { useState } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import { CopyButton } from '../../components/ui/CopyButton';
import { Button } from '../../components/ui/Button';
import { toUpperCase, toLowerCase, toTitleCase, toCamelCase, toSnakeCase } from './utils';

export default function TextCaseConverter() {
  const [input, setInput] = useState('');

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet 
        title="Text Case Converter" 
        description="Convert Text Case Online Instantly - Change to UPPERCASE, lowercase, Title Case, camelCase, or snake_case." 
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Text Case Converter</h1>
          <p className="mt-1 text-gray-500">Instantly transform your text formatting.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setInput('')}>Clear</Button>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type or paste your text here to preview transformations..."
            className="min-h-[150px] border-0 focus:ring-0 px-0 resize-y bg-transparent"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setInput(toUpperCase(input))} disabled={!input}>
          UPPERCASE
        </Button>
        <Button variant="secondary" onClick={() => setInput(toLowerCase(input))} disabled={!input}>
          lowercase
        </Button>
        <Button variant="secondary" onClick={() => setInput(toTitleCase(input))} disabled={!input}>
          Capitalize Each Word
        </Button>
        <Button variant="secondary" onClick={() => setInput(toCamelCase(input))} disabled={!input}>
          camelCase
        </Button>
        <Button variant="secondary" onClick={() => setInput(toSnakeCase(input))} disabled={!input}>
          snake_case
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Result Preview</CardTitle>
          <CopyButton value={input} />
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            readOnly
            placeholder="Result preview..."
            className="min-h-[150px] border-0 focus:ring-0 px-0 resize-y bg-transparent text-brand-600 dark:text-brand-400 font-mono"
          />
        </CardContent>
      </Card>
    </div>
  );
}
