import type { Page } from '../types';

export const TEMPLATES: Record<string, Page[]> = {
  student: [
    {
      id: 'template-lecture-notes',
      title: 'Lecture Notes',
      icon: 'BookOpen',
      blocks: [
        { id: '1', type: 'h1', content: 'Lecture Title' },
        { id: '2', type: 'text', content: 'Date: ' + new Date().toLocaleDateString() },
        { id: '3', type: 'h2', content: 'Objectives' },
        { id: '4', type: 'text', content: '• Key goal 1\n• Key goal 2' },
        { id: '5', type: 'h2', content: 'Notes' },
        { id: '6', type: 'text', content: 'Start typing here...' },
        { id: '7', type: 'h2', content: 'Summary' },
        { id: '8', type: 'text', content: '' },
      ]
    },
    {
      id: 'template-assignment',
      title: 'Homework Tracker',
      icon: 'ClipboardList',
      blocks: [
        { id: '1', type: 'h1', content: 'Assignment: [Subject Name]' },
        { id: '2', type: 'text', content: 'Due Date: ' },
        { id: '3', type: 'h2', content: 'Requirements' },
        { id: '4', type: 'text', content: '' },
        { id: '5', type: 'h2', content: 'Checklist' },
        { id: '6', type: 'table', content: [
          { Task: 'Research', Status: 'Not Started', Priority: 'High' },
          { Task: 'Draft', Status: 'Not Started', Priority: 'Medium' },
          { Task: 'Review', Status: 'Not Started', Priority: 'Low' },
        ]},
      ]
    }
  ],
  classroom: [
    {
      id: 'template-lesson-plan',
      title: 'Lesson Plan',
      icon: 'Presentation',
      blocks: [
        { id: '1', type: 'h1', content: 'Lesson Plan: [Topic]' },
        { id: '2', type: 'text', content: 'Subject: \nGrade Level: ' },
        { id: '3', type: 'h2', content: 'Learning Objectives' },
        { id: '4', type: 'text', content: 'By the end of this lesson, students will be able to...' },
        { id: '5', type: 'h2', content: 'Materials Needed' },
        { id: '6', type: 'text', content: '' },
        { id: '7', type: 'h2', content: 'Activities' },
        { id: '8', type: 'table', content: [
          { Duration: '10 min', Activity: 'Introduction', Interaction: 'Whole Class' },
          { Duration: '20 min', Activity: 'Group Work', Interaction: 'Small Groups' },
          { Duration: '15 min', Activity: 'Closing', Interaction: 'Individual' },
        ]},
      ]
    }
  ],
  general: [
    {
      id: 'template-daily-journal',
      title: 'Daily Journal',
      icon: 'Calendar',
      blocks: [
        { id: '1', type: 'h1', content: 'Journal: ' + new Date().toLocaleDateString() },
        { id: '2', type: 'h2', content: 'How was your day?' },
        { id: '3', type: 'text', content: '' },
        { id: '4', type: 'h2', content: 'Things I am grateful for' },
        { id: '5', type: 'text', content: '1. \n2. \n3. ' },
      ]
    }
  ]
};

export const INITIAL_PAGES: Page[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'Rocket',
    blocks: [
      { id: '1', type: 'h1', content: 'Welcome to NoteSpace' },
      { id: '2', type: 'text', content: 'This is your professional workspace for notes, ideas, and structured data.' },
      { id: '3', type: 'h2', content: 'Quick Tips' },
      { id: '4', type: 'text', content: '• Type **/** to insert blocks like Headers and Tables\n• Drag the **⠿** icon to reorder your ideas\n• Use the sidebar to organize different projects and categories' },
    ]
  }
];
