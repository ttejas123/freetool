'use client';

import { useState } from 'react';
import { SEOHelmet } from '../../components/SEOHelmet';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { countCharacters, countWords, countSentences, countParagraphs } from './utils';

export default function WordCounter() {
  const [input, setInput] = useState('');

  const stats = [
    { label: 'Words', value: countWords(input) },
    { label: 'Characters', value: countCharacters(input) },
    { label: 'Sentences', value: countSentences(input) },
    { label: 'Paragraphs', value: countParagraphs(input) }
  ];

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <SEOHelmet 
        title="Word & Character Counter" 
        description="Free Word & Character Counter Online - Instantly count words, characters, sentences, and paragraphs." 
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Word & Character Counter</h1>
          <p className="mt-1 text-gray-500">Instantly analyze your text structure and length.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="bg-white dark:bg-gray-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
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
            placeholder="Start typing or paste your text here..."
            className="min-h-[300px] border-0 focus:ring-0 px-0 resize-y bg-transparent text-gray-900 dark:text-gray-100"
          />
        </CardContent>
      </Card>
    </div>
  );
}
