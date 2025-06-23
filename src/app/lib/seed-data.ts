import { v4 as uuidv4 } from 'uuid';

export const testSeedData = [
  {
    id: uuidv4(),
    title: 'Personality Assessment',
    description: 'A comprehensive test to evaluate personality traits based on the five-factor model.',
    category: 'Personality',
    questions: [
      {
        text: 'I enjoy being the center of attention at social gatherings.',
        type: 'SCALE',
        options: [
          { value: '1', label: 'Strongly Disagree' },
          { value: '2', label: 'Disagree' },
          { value: '3', label: 'Neutral' },
          { value: '4', label: 'Agree' },
          { value: '5', label: 'Strongly Agree' }
        ],
        order: 1
      },
      {
        text: 'I prefer to have a plan rather than be spontaneous.',
        type: 'SCALE',
        options: [
          { value: '1', label: 'Strongly Disagree' },
          { value: '2', label: 'Disagree' },
          { value: '3', label: 'Neutral' },
          { value: '4', label: 'Agree' },
          { value: '5', label: 'Strongly Agree' }
        ],
        order: 2
      },
      {
        text: 'I find it easy to empathize with others\' feelings.',
        type: 'SCALE',
        options: [
          { value: '1', label: 'Strongly Disagree' },
          { value: '2', label: 'Disagree' },
          { value: '3', label: 'Neutral' },
          { value: '4', label: 'Agree' },
          { value: '5', label: 'Strongly Agree' }
        ],
        order: 3
      }
    ]
  },
  {
    id: uuidv4(),
    title: 'Anxiety Screening',
    description: 'A screening tool to assess anxiety levels and identify potential anxiety disorders.',
    category: 'Clinical',
    questions: [
      {
        text: 'How often have you been bothered by feeling nervous, anxious, or on edge?',
        type: 'SCALE',
        options: [
          { value: '0', label: 'Not at all' },
          { value: '1', label: 'Several days' },
          { value: '2', label: 'More than half the days' },
          { value: '3', label: 'Nearly every day' }
        ],
        order: 1
      },
      {
        text: 'How often have you been bothered by not being able to stop or control worrying?',
        type: 'SCALE',
        options: [
          { value: '0', label: 'Not at all' },
          { value: '1', label: 'Several days' },
          { value: '2', label: 'More than half the days' },
          { value: '3', label: 'Nearly every day' }
        ],
        order: 2
      },
      {
        text: 'How often have you been bothered by worrying too much about different things?',
        type: 'SCALE',
        options: [
          { value: '0', label: 'Not at all' },
          { value: '1', label: 'Several days' },
          { value: '2', label: 'More than half the days' },
          { value: '3', label: 'Nearly every day' }
        ],
        order: 3
      }
    ]
  },
  {
    id: uuidv4(),
    title: 'Depression Inventory',
    description: 'A self-report inventory to measure the severity of depression symptoms.',
    category: 'Clinical',
    questions: [
      {
        text: 'How often have you been bothered by feeling down, depressed, or hopeless?',
        type: 'SCALE',
        options: [
          { value: '0', label: 'Not at all' },
          { value: '1', label: 'Several days' },
          { value: '2', label: 'More than half the days' },
          { value: '3', label: 'Nearly every day' }
        ],
        order: 1
      },
      {
        text: 'How often have you been bothered by little interest or pleasure in doing things?',
        type: 'SCALE',
        options: [
          { value: '0', label: 'Not at all' },
          { value: '1', label: 'Several days' },
          { value: '2', label: 'More than half the days' },
          { value: '3', label: 'Nearly every day' }
        ],
        order: 2
      },
      {
        text: 'How often have you been bothered by trouble falling or staying asleep, or sleeping too much?',
        type: 'SCALE',
        options: [
          { value: '0', label: 'Not at all' },
          { value: '1', label: 'Several days' },
          { value: '2', label: 'More than half the days' },
          { value: '3', label: 'Nearly every day' }
        ],
        order: 3
      }
    ]
  }
]; 