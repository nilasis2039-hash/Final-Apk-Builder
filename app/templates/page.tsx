'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, CheckSquare, StickyNote, Timer, Scale, ArrowRightLeft, Flashlight, Dices, Hash, CloudSun } from 'lucide-react';
import Link from 'next/link';

const templates = [
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'A simple calculator app with basic arithmetic operations.',
    icon: Calculator,
    category: 'Utility',
  },
  {
    id: 'todo',
    name: 'Todo List',
    description: 'Keep track of your tasks with this simple todo list app.',
    icon: CheckSquare,
    category: 'Productivity',
  },
  {
    id: 'notes',
    name: 'Notes App',
    description: 'Write down your thoughts and ideas.',
    icon: StickyNote,
    category: 'Productivity',
  },
  {
    id: 'timer',
    name: 'Timer/Stopwatch',
    description: 'Measure time with precision.',
    icon: Timer,
    category: 'Utility',
  },
  {
    id: 'bmi',
    name: 'BMI Calculator',
    description: 'Calculate Body Mass Index easily.',
    icon: Scale,
    category: 'Health',
  },
  {
    id: 'converter',
    name: 'Unit Converter',
    description: 'Convert between different units of measurement.',
    icon: ArrowRightLeft,
    category: 'Utility',
  },
  {
    id: 'flashlight',
    name: 'Flashlight',
    description: 'Turn your device into a flashlight.',
    icon: Flashlight,
    category: 'Utility',
  },
  {
    id: 'dice',
    name: 'Dice Roller',
    description: 'Roll dice for board games.',
    icon: Dices,
    category: 'Game',
  },
  {
    id: 'counter',
    name: 'Counter App',
    description: 'Count anything with a simple tap.',
    icon: Hash,
    category: 'Utility',
  },
  {
    id: 'weather',
    name: 'Weather App',
    description: 'Check the current weather conditions.',
    icon: CloudSun,
    category: 'Utility',
  },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">App Templates</h1>
        <p className="text-slate-400">Start with a pre-built template to save time.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="bg-slate-900 border-slate-800 flex flex-col">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <template.icon className="w-6 h-6 text-purple-500" />
              </div>
              <CardTitle className="text-slate-200">{template.name}</CardTitle>
              <CardDescription>{template.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-slate-400">{template.description}</p>
            </CardContent>
            <CardFooter>
              <Link href={`/build?template=${template.id}`} className="w-full">
                <Button className="w-full bg-slate-800 hover:bg-slate-700">
                  Use Template
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
