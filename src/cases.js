// Data-driven case definitions.
// Case 1 is fully implemented per spec; Cases 2-20 are placeholders for future content.

export const CASES = [
  {
    id: 1,
    title: 'The Missing Prototype',
    crime: 'A prototype device disappeared from a research lab overnight. No forced entry.',
    suspects: [
      {
        id: 'lena',
        name: 'Lena Brooks',
        role: 'Lab Assistant',
        trait: 'Nervous',
        portraitLabel: 'LB',
        statements: [
          {
            id: 'lena-1',
            text: 'I left the lab at 6:00 PM.',
            truth: 'truth',
            toolSignals: {
              lieDetector: 'green',
              stopwatch: 'green',
              watch: 'green',
              notepad: [],
            },
          },
          {
            id: 'lena-2',
            text: "I didn’t see anyone else there.",
            truth: 'partial',
            toolSignals: {
              lieDetector: 'yellow',
              stopwatch: 'yellow',
              watch: 'unknown',
              notepad: ['This may conflict with someone claiming they saw her later.'],
            },
          },
          {
            id: 'lena-3',
            text: 'Mark was upset earlier.',
            truth: 'truth',
            toolSignals: {
              lieDetector: 'green',
              stopwatch: 'green',
              watch: 'unknown',
              notepad: [],
            },
          },
        ],
      },
      {
        id: 'mark',
        name: 'Mark Ellis',
        role: 'Senior Researcher',
        trait: 'Defensive',
        portraitLabel: 'ME',
        statements: [
          {
            id: 'mark-1',
            text: 'I stayed late for paperwork.',
            truth: 'partial',
            toolSignals: {
              lieDetector: 'yellow',
              stopwatch: 'yellow',
              watch: 'unknown',
              notepad: ['Time claim needs verification.'],
            },
          },
          {
            id: 'mark-2',
            text: 'The prototype was locked.',
            truth: 'truth',
            toolSignals: {
              lieDetector: 'green',
              stopwatch: 'green',
              watch: 'unknown',
              notepad: [],
            },
          },
          {
            id: 'mark-3',
            text: 'Jenna had access to storage.',
            truth: 'truth',
            toolSignals: {
              lieDetector: 'green',
              stopwatch: 'green',
              watch: 'green',
              notepad: ['Access does not prove theft, but it matters.'],
            },
          },
        ],
      },
      {
        id: 'jenna',
        name: 'Jenna Cole',
        role: 'Security Technician',
        trait: 'Calm',
        portraitLabel: 'JC',
        statements: [
          {
            id: 'jenna-1',
            text: 'There were no break-ins.',
            truth: 'truth',
            toolSignals: {
              lieDetector: 'green',
              stopwatch: 'green',
              watch: 'unknown',
              notepad: [],
            },
          },
          {
            id: 'jenna-2',
            text: 'I reviewed the security logs.',
            truth: 'misleading',
            toolSignals: {
              lieDetector: 'red',
              stopwatch: 'yellow',
              watch: 'unknown',
              notepad: ['If she can access logs, she can also alter them.'],
            },
          },
          {
            id: 'jenna-3',
            text: 'Mark left before me.',
            truth: 'misleading',
            toolSignals: {
              lieDetector: 'yellow',
              stopwatch: 'red',
              watch: 'red',
              notepad: ['Conflicts with Mark’s “stayed late” claim unless times are clarified.'],
            },
          },
        ],
      },
    ],
    culpritId: 'jenna',
    resolution:
      'Only Jenna had the technical ability to override logs. Tool usage reveals subtle deception and timeline inconsistencies.',
    minigames: [
      {
        id: 'timeline',
        title: 'Timeline Reconstruction',
        description: 'Put the events in the most plausible order based on statements.',
        kind: 'ordering',
        items: [
          { id: 'e1', text: 'Lena leaves the lab (6:00 PM).' },
          { id: 'e2', text: 'Mark does paperwork late.' },
          { id: 'e3', text: 'Jenna reviews security logs.' },
          { id: 'e4', text: 'Prototype disappears overnight.' },
        ],
        // Correct logical order for the puzzle.
        solution: ['e1', 'e2', 'e3', 'e4'],
      },
      {
        id: 'evidence',
        title: 'Evidence Matching',
        description: 'Match each evidence note to the best implication.',
        kind: 'matching',
        pairs: [
          {
            left: 'No forced entry',
            right: 'Someone with legitimate access likely took it.',
          },
          {
            left: 'Storage was locked',
            right: 'Keycard / access control matters more than lock-picking.',
          },
          {
            left: 'Security logs were “reviewed”',
            right: 'The logs are not automatically trustworthy.',
          },
        ],
      },
      {
        id: 'pattern',
        title: 'Pattern Recognition',
        description: 'Spot the odd detail that deserves follow-up.',
        kind: 'singleChoice',
        prompt: 'Which detail is the most suspicious and worth pressing on in interviews?',
        options: [
          'Mark was upset earlier',
          'There were no break-ins',
          'Jenna reviewed the security logs',
          'Lena left at 6:00 PM',
        ],
        answerIndex: 2,
      },
    ],
  },
  // Placeholders for cases 2-20 (structure only)
  ...Array.from({ length: 19 }, (_, i) => {
    const n = i + 2
    return {
      id: n,
      title: `Case ${n} (Placeholder)`,
      crime: 'Placeholder crime description. Add content later.',
      suspects: [
        {
          id: `c${n}-s1`,
          name: 'Suspect A',
          role: 'Placeholder Role',
          trait: 'Placeholder Trait',
          portraitLabel: 'A',
          statements: [{ id: `c${n}-s1-1`, text: 'Placeholder statement.', truth: 'partial', toolSignals: {} }],
        },
        {
          id: `c${n}-s2`,
          name: 'Suspect B',
          role: 'Placeholder Role',
          trait: 'Placeholder Trait',
          portraitLabel: 'B',
          statements: [{ id: `c${n}-s2-1`, text: 'Placeholder statement.', truth: 'partial', toolSignals: {} }],
        },
        {
          id: `c${n}-s3`,
          name: 'Suspect C',
          role: 'Placeholder Role',
          trait: 'Placeholder Trait',
          portraitLabel: 'C',
          statements: [{ id: `c${n}-s3-1`, text: 'Placeholder statement.', truth: 'partial', toolSignals: {} }],
        },
      ],
      culpritId: `c${n}-s1`,
      resolution: 'Placeholder resolution. Add content later.',
      minigames: n < 10 ? [{ id: `c${n}-m1`, title: 'Placeholder Minigame', description: 'Optional minigame placeholder.', kind: 'singleChoice', prompt: 'Placeholder?', options: ['A', 'B', 'C'], answerIndex: 0 }] : [],
    }
  }),
]

export function getCaseById(id) {
  return CASES.find((c) => c.id === id)
}
