import type { LearningPath, SkillLevel, LearningFormat, LearningObjective, LearningResource } from '../types';

// ─── Helper to generate a unique ID ──────────────────────────────────────────
let idCounter = 1;
function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${idCounter++}`;
}

// ─── Full Stack Developer Template ───────────────────────────────────────────
function fullStackTemplate(
  skillLevel: SkillLevel,
  hoursPerDay: number,
  targetWeeks: number,
  learningFormat: LearningFormat,
  learningObjective: LearningObjective
): LearningPath {
  const pathId = uid('path');
  const isBegineer = skillLevel === 'beginner';
  const isAdvanced = skillLevel === 'advanced';

  const stages = [
    {
      id: uid('stage'),
      number: 1,
      title: 'HTML, CSS & JavaScript Fundamentals',
      description: 'Build a solid foundation in the core languages of the web.',
      estimatedWeeks: isBegineer ? 3 : 2,
      modules: [
        {
          id: uid('mod'),
          title: 'HTML Essentials',
          description: 'Learn semantic HTML5 to structure web content properly.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'HTML Document Structure', description: 'Understand doctypes, head, body, and semantic tags.',
              duration: '30 min', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'MDN HTML Guide', type: 'documentation' as const, url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', duration: '20 min' }],
            },
            {
              id: uid('les'), title: 'Semantic HTML Tags', description: 'Use header, main, article, section, aside, and footer correctly.',
              duration: '45 min', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Semantic HTML – web.dev', type: 'article' as const, url: 'https://web.dev/learn/html/semantic-html/', duration: '25 min' }],
            },
            {
              id: uid('les'), title: 'HTML Forms & Accessibility', description: 'Build accessible forms with labels, ARIA, and input validation.',
              duration: '1 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'HTML Forms Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=fNcJuPIZ2WE', duration: '45 min' }],
            },
          ],
        },
        {
          id: uid('mod'),
          title: 'CSS Styling & Layout',
          description: 'Master CSS selectors, box model, flexbox, and grid.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'CSS Selectors & Specificity', description: 'Class, ID, attribute, and combinatory selectors explained.',
              duration: '45 min', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'CSS Selectors Reference', type: 'documentation' as const, url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors', duration: '30 min' }],
            },
            {
              id: uid('les'), title: 'Flexbox & CSS Grid', description: 'Build modern responsive layouts with flexbox and grid.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Flexbox Froggy Game', type: 'course' as const, url: 'https://flexboxfroggy.com', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'Responsive Design & Media Queries', description: 'Make your UI work on all screen sizes.',
              duration: '1 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Responsive Design – web.dev', type: 'article' as const, url: 'https://web.dev/learn/design/', duration: '45 min' }],
            },
          ],
        },
        ...(isBegineer ? [{
          id: uid('mod'),
          title: 'JavaScript Fundamentals',
          description: 'Variables, functions, loops, and DOM manipulation.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'Variables, Types & Operators', description: 'let, const, data types, and arithmetic/logical operators.',
              duration: '1 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'JavaScript.info – The Basics', type: 'article' as const, url: 'https://javascript.info/first-steps', duration: '50 min' }],
            },
            {
              id: uid('les'), title: 'Functions & Scope', description: 'Function declarations, expressions, arrow functions, and closures.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'JS Functions Deep Dive', type: 'video' as const, url: 'https://www.youtube.com/watch?v=gigtS_5KOqo', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'DOM Manipulation', description: 'Select, modify, and create HTML elements with JavaScript.',
              duration: '2 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'DOM Tutorial – MDN', type: 'documentation' as const, url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'Stage 1 Project: Portfolio Page', description: 'Build a personal portfolio page using only HTML, CSS, and JavaScript.',
              duration: '4 hr', completed: false, type: 'project' as const,
              resources: [{ id: uid('res'), title: 'Portfolio Project Guide – freeCodeCamp', type: 'article' as const, url: 'https://www.freecodecamp.org/news/how-to-build-a-portfolio-website/', duration: '1 hr' }],
            },
          ],
        }] : []),
      ],
    },
    {
      id: uid('stage'),
      number: 2,
      title: 'React & Frontend Development',
      description: 'Build dynamic UIs with the most popular frontend library.',
      estimatedWeeks: isBegineer ? 4 : 3,
      modules: [
        {
          id: uid('mod'),
          title: 'React Core Concepts',
          description: 'Components, JSX, props, and state management.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'Components & JSX', description: 'Understand function components and the JSX syntax.',
              duration: '1 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'React Docs – Describing the UI', type: 'documentation' as const, url: 'https://react.dev/learn/describing-the-ui', duration: '45 min' }],
            },
            {
              id: uid('les'), title: 'useState & useEffect Hooks', description: 'Manage component state and side effects.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'React Hooks Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=O6P86uwfdR0', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'React Router DOM', description: 'Client-side routing for multi-page apps.',
              duration: '1 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'React Router Tutorial', type: 'documentation' as const, url: 'https://reactrouter.com/en/main/start/tutorial', duration: '50 min' }],
            },
          ],
        },
        {
          id: uid('mod'),
          title: 'State Management & Data Fetching',
          description: 'Context API, reducers, and async data with fetch/axios.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'Context API & useReducer', description: 'Share state globally without prop drilling.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Context API Guide', type: 'documentation' as const, url: 'https://react.dev/learn/passing-data-deeply-with-context', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'Fetching Data & Error Handling', description: 'REST APIs, async/await, loading & error states.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Data Fetching Patterns', type: 'article' as const, url: 'https://www.robinwieruch.de/react-hooks-fetch-data/', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'Checkpoint: React Mini-App', description: 'Build a task manager app demonstrating React fundamentals.',
              duration: '3 hr', completed: false, type: 'checkpoint' as const,
              resources: [{ id: uid('res'), title: 'Building a Task Manager with React', type: 'video' as const, url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', duration: '1 hr' }],
            },
          ],
        },
      ],
    },
    {
      id: uid('stage'),
      number: 3,
      title: 'Backend Development & REST APIs',
      description: 'Build server-side applications with Node.js and Express.',
      estimatedWeeks: isBegineer ? 3 : 2,
      modules: [
        {
          id: uid('mod'),
          title: 'Node.js & Express',
          description: 'Server-side JavaScript with the Express framework.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'Node.js Fundamentals', description: 'Event loop, modules, npm, and the file system API.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Node.js Docs', type: 'documentation' as const, url: 'https://nodejs.org/en/docs', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'Building REST APIs with Express', description: 'Routes, middleware, request/response lifecycle.',
              duration: '2 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Express REST API Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=pKd0Rpw7O48', duration: '1.5 hr' }],
            },
            {
              id: uid('les'), title: 'Authentication with JWT', description: 'Implement secure token-based authentication.',
              duration: '2 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'JWT Auth Guide', type: 'article' as const, url: 'https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs', duration: '1.5 hr' }],
            },
          ],
        },
      ],
    },
    {
      id: uid('stage'),
      number: 4,
      title: 'Databases & SQL',
      description: 'Store and query data with relational and NoSQL databases.',
      estimatedWeeks: 2,
      modules: [
        {
          id: uid('mod'),
          title: 'SQL & PostgreSQL',
          description: 'Relational database design, queries, and joins.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'SQL Fundamentals', description: 'SELECT, INSERT, UPDATE, DELETE, and WHERE clauses.',
              duration: '2 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'SQLZoo Interactive Tutorials', type: 'course' as const, url: 'https://sqlzoo.net', duration: '2 hr' }],
            },
            {
              id: uid('les'), title: 'Database Design & Joins', description: 'Normalization, foreign keys, inner/outer joins.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Database Design Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=ztHopE5Wnpc', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'MongoDB Basics', description: 'Documents, collections, CRUD operations with Mongoose.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'MongoDB University', type: 'course' as const, url: 'https://university.mongodb.com', duration: '3 hr' }],
            },
          ],
        },
      ],
    },
    {
      id: uid('stage'),
      number: 5,
      title: 'Full-Stack Integration',
      description: 'Connect your React frontend to your Node.js backend seamlessly.',
      estimatedWeeks: 2,
      modules: [
        {
          id: uid('mod'),
          title: 'Full-Stack App Architecture',
          description: 'CORS, environment variables, and API integration patterns.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'Connecting React to Express API', description: 'Fetch API data in React, handle CORS, and manage environment config.',
              duration: '2 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Full-Stack Integration Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=w3vs4a03y3I', duration: '1.5 hr' }],
            },
            {
              id: uid('les'), title: 'File Uploads & Image Handling', description: 'Multer middleware, cloud storage with Cloudinary.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'File Upload Guide', type: 'article' as const, url: 'https://www.digitalocean.com/community/tutorials/nodejs-uploading-files-multer-express', duration: '1 hr' }],
            },
          ],
        },
      ],
    },
    ...(isAdvanced ? [] : [{
      id: uid('stage'),
      number: 6,
      title: 'Testing, Deployment & Portfolio',
      description: 'Ship production-ready apps with CI/CD and solid test coverage.',
      estimatedWeeks: 3,
      modules: [
        {
          id: uid('mod'),
          title: 'Testing Fundamentals',
          description: 'Unit tests, integration tests, and end-to-end testing.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'), title: 'Jest & React Testing Library', description: 'Test React components and utility functions.',
              duration: '2 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Testing React Apps', type: 'documentation' as const, url: 'https://testing-library.com/docs/react-testing-library/intro/', duration: '1.5 hr' }],
            },
            {
              id: uid('les'), title: 'Deploying to Vercel & Railway', description: 'Deploy your frontend to Vercel and backend to Railway.',
              duration: '1.5 hr', completed: false, type: 'lesson' as const,
              resources: [{ id: uid('res'), title: 'Vercel Deployment Guide', type: 'documentation' as const, url: 'https://vercel.com/docs', duration: '1 hr' }],
            },
            {
              id: uid('les'), title: 'Final Capstone: Job Board App', description: 'Build and deploy a full-stack job board application for your portfolio.',
              duration: '10 hr', completed: false, type: 'project' as const,
              resources: [{ id: uid('res'), title: 'Full-Stack Web App Project Guide', type: 'article' as const, url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', duration: '2 hr' }],
            },
          ],
        },
      ],
    }]),
  ];

  // Count total lessons
  let totalLessons = 0;
  stages.forEach(s => s.modules.forEach(m => { totalLessons += m.lessons.length; }));

  return {
    id: pathId,
    title: 'Full Stack Developer Roadmap',
    careerGoal: 'Full Stack Developer',
    skillLevel,
    status: 'not-started',
    description: 'A comprehensive, stage-by-stage roadmap to becoming a job-ready full stack developer — from HTML fundamentals to deploying production applications.',
    stages,
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
    estimatedDuration: `${stages.reduce((acc, s) => acc + s.estimatedWeeks, 0)} weeks`,
    totalLessons,
    completedLessons: 0,
    hoursPerDay,
    targetWeeks,
    learningFormat,
    learningObjective,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    icon: '💻',
    color: 'indigo',
  };
}

// ─── AI/ML Engineer Template ──────────────────────────────────────────────────
function aiMlTemplate(
  skillLevel: SkillLevel,
  hoursPerDay: number,
  targetWeeks: number,
  learningFormat: LearningFormat,
  learningObjective: LearningObjective
): LearningPath {
  const pathId = uid('path');

  const stages = [
    {
      id: uid('stage'), number: 1, title: 'Python for Data Science', description: 'Master Python essentials for ML engineering.',
      estimatedWeeks: skillLevel === 'beginner' ? 4 : 2,
      modules: [
        {
          id: uid('mod'), title: 'Python Fundamentals', description: 'Variables, control flow, functions, and OOP.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Python Basics & Data Types', description: 'Lists, dicts, tuples, and string operations.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Python.org Tutorial', type: 'documentation' as const, url: 'https://docs.python.org/3/tutorial/', duration: '2 hr' }] },
            { id: uid('les'), title: 'NumPy & Pandas', description: 'Array operations, DataFrames, and data manipulation.', duration: '3 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Pandas Documentation', type: 'documentation' as const, url: 'https://pandas.pydata.org/docs/user_guide/', duration: '2 hr' }] },
            { id: uid('les'), title: 'Data Visualization with Matplotlib & Seaborn', description: 'Create insightful charts and plots.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Matplotlib Tutorial', type: 'documentation' as const, url: 'https://matplotlib.org/stable/tutorials/', duration: '1.5 hr' }] },
          ],
        },
      ],
    },
    {
      id: uid('stage'), number: 2, title: 'Machine Learning Fundamentals', description: 'Core ML algorithms and model evaluation.',
      estimatedWeeks: 4,
      modules: [
        {
          id: uid('mod'), title: 'Supervised Learning', description: 'Regression, classification, and evaluation metrics.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Linear & Logistic Regression', description: 'Understand the math and implementation of regression models.', duration: '3 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Scikit-learn Guide', type: 'documentation' as const, url: 'https://scikit-learn.org/stable/supervised_learning.html', duration: '2 hr' }] },
            { id: uid('les'), title: 'Decision Trees & Random Forests', description: 'Ensemble methods for classification and regression.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Ensemble Methods Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=J4Wdy0Wc_xQ', duration: '1.5 hr' }] },
            { id: uid('les'), title: 'Model Evaluation & Cross-Validation', description: 'Accuracy, precision, recall, F1, and k-fold CV.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Model Evaluation Guide', type: 'article' as const, url: 'https://machinelearningmastery.com/evaluate-skill-deep-learning-models/', duration: '1 hr' }] },
            { id: uid('les'), title: 'Project: Titanic Survival Prediction', description: 'Apply ML to a classic dataset using scikit-learn.', duration: '5 hr', completed: false, type: 'project' as const, resources: [{ id: uid('res'), title: 'Kaggle Titanic Survival Walkthrough', type: 'course' as const, url: 'https://www.kaggle.com/c/titanic', duration: '2 hr' }] },
          ],
        },
      ],
    },
    {
      id: uid('stage'), number: 3, title: 'Deep Learning & Neural Networks', description: 'Build and train neural networks with TensorFlow and PyTorch.',
      estimatedWeeks: 5,
      modules: [
        {
          id: uid('mod'), title: 'Neural Network Foundations', description: 'Perceptrons, activation functions, backpropagation.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Introduction to Neural Networks', description: 'Architecture, weights, biases, and forward pass.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: '3Blue1Brown – Neural Networks', type: 'video' as const, url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', duration: '2 hr' }] },
            { id: uid('les'), title: 'TensorFlow & Keras', description: 'Build, compile, and train deep learning models.', duration: '3 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'TensorFlow Tutorials', type: 'documentation' as const, url: 'https://www.tensorflow.org/tutorials', duration: '2 hr' }] },
            { id: uid('les'), title: 'Convolutional Neural Networks (CNNs)', description: 'Image classification with conv layers and pooling.', duration: '3 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'CNN Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=ArPaAX_PhIs', duration: '2 hr' }] },
          ],
        },
      ],
    },
    {
      id: uid('stage'), number: 4, title: 'NLP & LLMs', description: 'Natural Language Processing and working with Large Language Models.',
      estimatedWeeks: 4,
      modules: [
        {
          id: uid('mod'), title: 'NLP Fundamentals & Transformers', description: 'Tokenization, embeddings, attention, and Hugging Face.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Text Processing & Embeddings', description: 'TF-IDF, word2vec, and sentence embeddings.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'NLP with Python', type: 'course' as const, url: 'https://www.nltk.org/book/', duration: '3 hr' }] },
            { id: uid('les'), title: 'Transformer Architecture & BERT', description: 'Self-attention, positional encoding, and fine-tuning.', duration: '3 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Hugging Face Course', type: 'course' as const, url: 'https://huggingface.co/learn/nlp-course', duration: '5 hr' }] },
            { id: uid('les'), title: 'Prompt Engineering & API Integration', description: 'Use Gemini/GPT APIs effectively in applications.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Prompt Engineering Guide', type: 'article' as const, url: 'https://www.promptingguide.ai', duration: '1.5 hr' }] },
          ],
        },
      ],
    },
    {
      id: uid('stage'), number: 5, title: 'MLOps & Deployment', description: 'Deploy ML models to production with best practices.',
      estimatedWeeks: 3,
      modules: [
        {
          id: uid('mod'), title: 'Model Serving & Monitoring', description: 'FastAPI, Docker, and model monitoring.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Building ML APIs with FastAPI', description: 'Serve predictions via a REST API.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'FastAPI + ML Tutorial', type: 'article' as const, url: 'https://fastapi.tiangolo.com/tutorial/', duration: '1.5 hr' }] },
            { id: uid('les'), title: 'Containerizing with Docker', description: 'Package your ML app for portable deployment.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Docker for ML Engineers', type: 'video' as const, url: 'https://www.youtube.com/watch?v=0H2miBK_gAk', duration: '1.5 hr' }] },
            { id: uid('les'), title: 'Capstone: End-to-End ML Pipeline', description: 'Build a sentiment analysis app and deploy to the cloud.', duration: '8 hr', completed: false, type: 'project' as const, resources: [{ id: uid('res'), title: 'MLOps Pipeline Deployment Guide', type: 'documentation' as const, url: 'https://developers.google.com/machine-learning/guides/rules-of-ml', duration: '2 hr' }] },
          ],
        },
      ],
    },
  ];

  let totalLessons = 0;
  stages.forEach(s => s.modules.forEach(m => { totalLessons += m.lessons.length; }));

  return {
    id: pathId,
    title: 'AI/ML Engineer Roadmap',
    careerGoal: 'AI/ML Engineer',
    skillLevel,
    status: 'not-started',
    description: 'A structured pathway to becoming an AI/ML engineer — from Python fundamentals to building and deploying production ML systems.',
    stages,
    requiredSkills: ['Python', 'Mathematics', 'Statistics', 'TensorFlow/PyTorch', 'SQL'],
    estimatedDuration: `${stages.reduce((acc, s) => acc + s.estimatedWeeks, 0)} weeks`,
    totalLessons,
    completedLessons: 0,
    hoursPerDay,
    targetWeeks,
    learningFormat,
    learningObjective,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    icon: '🤖',
    color: 'secondary',
  };
}

// ─── Data Analyst Template ────────────────────────────────────────────────────
function dataAnalystTemplate(
  skillLevel: SkillLevel,
  hoursPerDay: number,
  targetWeeks: number,
  learningFormat: LearningFormat,
  learningObjective: LearningObjective
): LearningPath {
  const pathId = uid('path');

  const stages = [
    {
      id: uid('stage'), number: 1, title: 'Data Analysis Foundations', description: 'Excel, SQL, and analytical thinking.',
      estimatedWeeks: 3,
      modules: [
        {
          id: uid('mod'), title: 'Excel & Spreadsheet Mastery', description: 'Formulas, pivot tables, and data cleaning.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Excel Formulas & Functions', description: 'VLOOKUP, INDEX/MATCH, SUMIF, and text functions.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Excel for Data Analysis', type: 'video' as const, url: 'https://www.youtube.com/watch?v=6bPBE6XvMNg', duration: '1.5 hr' }] },
            { id: uid('les'), title: 'Pivot Tables & Data Cleaning', description: 'Summarize data, remove duplicates, handle nulls.', duration: '1.5 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Pivot Table Tutorial', type: 'video' as const, url: 'https://www.youtube.com/watch?v=m0wI61ahfLc', duration: '1 hr' }] },
          ],
        },
        {
          id: uid('mod'), title: 'SQL for Analysis', description: 'Query, aggregate, and join data from databases.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'SQL Queries & Filtering', description: 'SELECT, WHERE, ORDER BY, and LIMIT.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Mode SQL Tutorial', type: 'course' as const, url: 'https://mode.com/sql-tutorial/', duration: '3 hr' }] },
            { id: uid('les'), title: 'Aggregations & Window Functions', description: 'GROUP BY, HAVING, ROW_NUMBER, RANK.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Advanced SQL Guide', type: 'article' as const, url: 'https://towardsdatascience.com/sql-window-functions-explained', duration: '1.5 hr' }] },
          ],
        },
      ],
    },
    {
      id: uid('stage'), number: 2, title: 'Python for Analysis', description: 'Pandas, NumPy, and data wrangling.', estimatedWeeks: 3,
      modules: [
        {
          id: uid('mod'), title: 'Pandas & Data Manipulation', description: 'DataFrames, groupby, merge, and reshaping.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Pandas DataFrames', description: 'Create, index, filter, and manipulate DataFrames.', duration: '2.5 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Pandas 10-minute Guide', type: 'documentation' as const, url: 'https://pandas.pydata.org/docs/user_guide/10min.html', duration: '1 hr' }] },
            { id: uid('les'), title: 'Data Cleaning & Wrangling', description: 'Handle missing data, outliers, and data type conversions.', duration: '2 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Data Cleaning with Pandas', type: 'video' as const, url: 'https://www.youtube.com/watch?v=KdmPHEnPJPs', duration: '1.5 hr' }] },
            { id: uid('les'), title: 'Project: E-commerce Sales Analysis', description: 'Analyze a sales dataset and derive business insights.', duration: '4 hr', completed: false, type: 'project' as const, resources: [] },
          ],
        },
      ],
    },
    {
      id: uid('stage'), number: 3, title: 'Data Visualization', description: 'Tableau, Power BI, and Python charting.', estimatedWeeks: 3,
      modules: [
        {
          id: uid('mod'), title: 'Visualization Tools', description: 'Build interactive dashboards and reports.', completed: false, expanded: false,
          lessons: [
            { id: uid('les'), title: 'Tableau Desktop Fundamentals', description: 'Connect data, build charts, filters, and dashboards.', duration: '3 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Tableau Training', type: 'course' as const, url: 'https://www.tableau.com/learn/training', duration: '4 hr' }] },
            { id: uid('les'), title: 'Power BI Essentials', description: 'DAX formulas, report design, and sharing.', duration: '2.5 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Power BI Guided Learning', type: 'course' as const, url: 'https://docs.microsoft.com/en-us/power-bi/guided-learning/', duration: '3 hr' }] },
            { id: uid('les'), title: 'Storytelling with Data', description: 'Design principles for clear, persuasive data narratives.', duration: '1.5 hr', completed: false, type: 'lesson' as const, resources: [{ id: uid('res'), title: 'Storytelling with Data Blog', type: 'article' as const, url: 'https://www.storytellingwithdata.com/blog', duration: '1 hr' }] },
          ],
        },
      ],
    },
  ];

  let totalLessons = 0;
  stages.forEach(s => s.modules.forEach(m => { totalLessons += m.lessons.length; }));

  return {
    id: pathId,
    title: 'Data Analyst Roadmap',
    careerGoal: 'Data Analyst',
    skillLevel,
    status: 'not-started',
    description: 'A practical pathway to becoming a data analyst — covering Excel, SQL, Python, and data visualization tools used in the industry.',
    stages,
    requiredSkills: ['SQL', 'Excel', 'Python', 'Statistics', 'Visualization'],
    estimatedDuration: `${stages.reduce((acc, s) => acc + s.estimatedWeeks, 0)} weeks`,
    totalLessons,
    completedLessons: 0,
    hoursPerDay,
    targetWeeks,
    learningFormat,
    learningObjective,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    icon: '📊',
    color: 'accent',
  };
}

// ─── Resource Generator for Generic & Custom Paths ───────────────────────────
function generateCuratedResourcesForLesson(
  lessonTitle: string,
  careerGoal: string,
  format: LearningFormat = 'mixed'
): LearningResource[] {
  const text = `${lessonTitle} ${careerGoal}`.toLowerCase();
  const resources: LearningResource[] = [];

  if (text.includes('figma') || text.includes('wirefram') || text.includes('prototyp') || text.includes('ui/ux') || text.includes('design system')) {
    resources.push({
      id: uid('res'),
      title: 'Figma Learn & Design System Guide',
      type: 'documentation',
      url: 'https://help.figma.com/hc/en-us/categories/360002051613-Learn-Design',
      duration: '45 min',
    });
    resources.push({
      id: uid('res'),
      title: 'Nielsen Norman Group UX Research',
      type: 'article',
      url: 'https://www.nngroup.com/articles/',
      duration: '30 min',
    });
  } else if (text.includes('security') || text.includes('cyber') || text.includes('owasp') || text.includes('vulnerability') || text.includes('wireshark') || text.includes('nmap') || text.includes('cryptography')) {
    resources.push({
      id: uid('res'),
      title: 'OWASP Top 10 Security Project',
      type: 'documentation',
      url: 'https://owasp.org/www-project-top-ten/',
      duration: '45 min',
    });
    resources.push({
      id: uid('res'),
      title: 'PortSwigger Web Security Academy',
      type: 'course',
      url: 'https://portswigger.net/web-security',
      duration: '1 hr',
    });
  } else if (text.includes('test') || text.includes('qa') || text.includes('selenium') || text.includes('cypress') || text.includes('playwright') || text.includes('postman')) {
    resources.push({
      id: uid('res'),
      title: 'Cypress End-to-End Testing Documentation',
      type: 'documentation',
      url: 'https://docs.cypress.io/guides/overview/why-cypress',
      duration: '45 min',
    });
    resources.push({
      id: uid('res'),
      title: 'Martin Fowler: Practical Test Pyramid',
      type: 'article',
      url: 'https://martinfowler.com/articles/practical-test-pyramid.html',
      duration: '35 min',
    });
  } else if (text.includes('cloud') || text.includes('aws') || text.includes('azure') || text.includes('docker') || text.includes('kubernetes') || text.includes('terraform') || text.includes('devops')) {
    resources.push({
      id: uid('res'),
      title: 'Docker Documentation & Getting Started',
      type: 'documentation',
      url: 'https://docs.docker.com/get-started/',
      duration: '45 min',
    });
    resources.push({
      id: uid('res'),
      title: 'AWS Cloud Architecture & Services',
      type: 'course',
      url: 'https://aws.amazon.com/getting-started/',
      duration: '1 hr',
    });
  } else if (text.includes('mobile') || text.includes('react native') || text.includes('flutter') || text.includes('ios') || text.includes('android')) {
    resources.push({
      id: uid('res'),
      title: 'React Native Official Documentation',
      type: 'documentation',
      url: 'https://reactnative.dev/docs/getting-started',
      duration: '45 min',
    });
    resources.push({
      id: uid('res'),
      title: 'Flutter Codelabs & Guides',
      type: 'course',
      url: 'https://docs.flutter.dev/',
      duration: '1 hr',
    });
  } else if (text.includes('python')) {
    resources.push({
      id: uid('res'),
      title: 'Python Official Documentation & Tutorial',
      type: 'documentation',
      url: 'https://docs.python.org/3/tutorial/',
      duration: '1 hr',
    });
  } else if (text.includes('react') || text.includes('frontend') || text.includes('javascript') || text.includes('typescript')) {
    resources.push({
      id: uid('res'),
      title: 'MDN Web Docs — Modern JavaScript & Web APIs',
      type: 'documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      duration: '45 min',
    });
    resources.push({
      id: uid('res'),
      title: 'React Official Documentation',
      type: 'documentation',
      url: 'https://react.dev/learn',
      duration: '1 hr',
    });
  } else {
    // Dynamic topic fallback for ANY custom domain / course / technology / skill
    // No verified discovery provider is available in demo mode. Returning no
    // resource is safer than presenting a generated search page as a lesson.
    return resources;
    const cleanTopic = lessonTitle.replace(/[^\w\s-]/g, '').trim() || careerGoal;
    if (format === 'video') {
      resources.push({
        id: uid('res'),
        title: `${lessonTitle} — Video Tutorial`,
        type: 'video',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTopic)}+tutorial`,
        duration: '45 min',
      });
      resources.push({
        id: uid('res'),
        title: `${careerGoal} Guide & Best Practices`,
        type: 'documentation',
        url: 'https://roadmap.sh',
        duration: '30 min',
      });
    } else {
      resources.push({
        id: uid('res'),
        title: `${lessonTitle} — Study Guide`,
        type: 'article',
        url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(cleanTopic)}`,
        duration: '45 min',
      });
      resources.push({
        id: uid('res'),
        title: `${lessonTitle} — Video Walkthrough`,
        type: 'video',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTopic)}+tutorial`,
        duration: '35 min',
      });
    }
  }

  return resources;
}

// ─── Generic Template for Other Careers ──────────────────────────────────────
function genericTemplate(
  careerGoal: string,
  skillLevel: SkillLevel,
  hoursPerDay: number,
  targetWeeks: number,
  learningFormat: LearningFormat,
  learningObjective: LearningObjective
): LearningPath {
  const pathId = uid('path');
  const careerMap: Record<string, { icon: string; color: string; description: string; skills: string[] }> = {
    'UI/UX Designer': { icon: '🎨', color: 'pink', description: 'Design intuitive and beautiful digital experiences through research, wireframing, and prototyping.', skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'] },
    'Cybersecurity Analyst': { icon: '🔐', color: 'red', description: 'Protect systems and networks from cyber threats through analysis, monitoring, and response.', skills: ['Networking', 'Linux', 'Security Tools', 'Cryptography'] },
    'Software Tester': { icon: '🧪', color: 'green', description: 'Ensure software quality through systematic testing strategies and automation frameworks.', skills: ['Test Planning', 'Selenium', 'API Testing', 'Agile'] },
    'Cloud Engineer': { icon: '☁️', color: 'sky', description: 'Design and manage scalable cloud infrastructure with modern DevOps practices.', skills: ['AWS/Azure', 'Docker', 'Kubernetes', 'Terraform'] },
    'Mobile App Developer': { icon: '📱', color: 'orange', description: 'Build cross-platform mobile applications with delightful user experiences.', skills: ['React Native', 'Flutter', 'APIs', 'App Store'] },
  };

  const meta = careerMap[careerGoal] ?? { icon: '🎯', color: 'indigo', description: `A structured learning roadmap to help you achieve your goal of becoming a ${careerGoal}.`, skills: ['Core Concepts', 'Tools', 'Best Practices', 'Projects'] };

  // Generate specialized lessons based on career
  const isUIUX = careerGoal === 'UI/UX Designer';
  const isSecurity = careerGoal === 'Cybersecurity Analyst';
  const isTester = careerGoal === 'Software Tester';
  const isCloud = careerGoal === 'Cloud Engineer';
  const isMobile = careerGoal === 'Mobile App Developer';

  const stages = [
    {
      id: uid('stage'),
      number: 1,
      title: isUIUX
        ? 'UI/UX Fundamentals & User Research'
        : isSecurity
        ? 'Networking, Linux & Security Fundamentals'
        : isTester
        ? 'QA Testing Principles & Manual Test Design'
        : isCloud
        ? 'Cloud Architecture & Linux Foundations'
        : isMobile
        ? 'Mobile Development Fundamentals & UI'
        : `${careerGoal} Fundamentals`,
      description: 'Build the foundational knowledge and core concepts required for this domain.',
      estimatedWeeks: 3,
      modules: [
        {
          id: uid('mod'),
          title: isUIUX ? 'Design Thinking & Research' : isSecurity ? 'Network & System Security' : isTester ? 'Test Planning & Bug Life Cycle' : isCloud ? 'Cloud Basics & Compute' : isMobile ? 'Mobile UI Layouts & Components' : 'Core Concepts',
          description: 'Essential theory, principles, and fundamental skills.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'),
              title: isUIUX ? 'User Research Methods & Personas' : isSecurity ? 'TCP/IP, OSI Model & Wireshark' : isTester ? 'Test Case Writing & Bug Reports' : isCloud ? 'Cloud Service Models (IaaS, PaaS, SaaS)' : isMobile ? 'Mobile UI Components & Styling' : `${careerGoal} Orientation & Core Principles`,
              description: `Master the essential basics every ${careerGoal} practitioner needs.`,
              duration: '1.5 hr',
              completed: false,
              type: 'lesson' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'User Research' : isSecurity ? 'Wireshark Networking' : isTester ? 'Test Case Design' : isCloud ? 'Cloud Architecture' : isMobile ? 'Mobile UI Components' : `${careerGoal} Fundamentals`, careerGoal, learningFormat),
            },
            {
              id: uid('les'),
              title: isUIUX ? 'Wireframing & Low-Fidelity Layouts in Figma' : isSecurity ? 'Linux Security & User Permissions' : isTester ? 'API Testing with Postman' : isCloud ? 'Linux Administration for Cloud' : isMobile ? 'State Management & Navigation' : 'Key Methods & Industry Standards',
              description: 'Learn foundational industry workflows and practical skills.',
              duration: '2 hr',
              completed: false,
              type: 'lesson' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'Figma Wireframing' : isSecurity ? 'Linux Security' : isTester ? 'Postman API Testing' : isCloud ? 'Linux Cloud' : isMobile ? 'Mobile Navigation' : 'Methods and Standards', careerGoal, learningFormat),
            },
            {
              id: uid('les'),
              title: isUIUX ? 'Hands-on Project: Wireframe a Mobile Onboarding Flow' : isSecurity ? 'Hands-on Lab: Network Packet Analysis' : isTester ? 'Project: Test Plan & Automated API Suite' : isCloud ? 'Hands-on Lab: Deploy a Virtual Server' : isMobile ? 'Project: Multi-Screen Mobile App Prototype' : 'Hands-on Practice: Starter Project',
              description: 'Apply your foundational knowledge in a guided starter project.',
              duration: '4 hr',
              completed: false,
              type: 'project' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'Figma Project' : isSecurity ? 'Network Security Project' : isTester ? 'QA Test Project' : isCloud ? 'Cloud Deployment Project' : isMobile ? 'Mobile App Project' : 'Starter Project', careerGoal, learningFormat),
            },
          ],
        },
      ],
    },
    {
      id: uid('stage'),
      number: 2,
      title: isUIUX
        ? 'Design Systems & Interactive Prototyping'
        : isSecurity
        ? 'Vulnerability Assessment & Web Defense'
        : isTester
        ? 'Test Automation with Cypress & Selenium'
        : isCloud
        ? 'Containers & Infrastructure as Code'
        : isMobile
        ? 'Device APIs & Native Features'
        : 'Tools & Technologies',
      description: 'Master industry-standard tooling, automation, and advanced workflows.',
      estimatedWeeks: 4,
      modules: [
        {
          id: uid('mod'),
          title: isUIUX ? 'Component Libraries & Prototyping' : isSecurity ? 'OWASP & Threat Modeling' : isTester ? 'Automated Test Suites' : isCloud ? 'Docker & Kubernetes' : isMobile ? 'Data Fetching & Offline Storage' : 'Primary Tooling',
          description: `Master tools and workflows commonly used by professional ${careerGoal}s.`,
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'),
              title: isUIUX ? 'Figma Auto Layout & Reusable Variants' : isSecurity ? 'OWASP Top 10 Web Vulnerabilities' : isTester ? 'Cypress End-to-End Test Automation' : isCloud ? 'Docker Containerization & Dockerfiles' : isMobile ? 'Accessing Device Camera & Local Storage' : 'Tool Setup & Core Configuration',
              description: 'Install, configure, and operate essential tools in real scenarios.',
              duration: '2 hr',
              completed: false,
              type: 'lesson' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'Figma Auto Layout' : isSecurity ? 'OWASP Top 10' : isTester ? 'Cypress Testing' : isCloud ? 'Docker Containerization' : isMobile ? 'Device APIs' : 'Tool Setup', careerGoal, learningFormat),
            },
            {
              id: uid('les'),
              title: isUIUX ? 'Usability Testing & Design Handoff' : isSecurity ? 'Vulnerability Scanning with Nmap' : isTester ? 'Integration Testing & Test Frameworks' : isCloud ? 'Kubernetes Pods & Deployments' : isMobile ? 'REST API Integration & Authentication' : 'Standard Workflows & Best Practices',
              description: 'Learn standard workflows, teamwork handoffs, and production practices.',
              duration: '2.5 hr',
              completed: false,
              type: 'lesson' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'Usability Testing' : isSecurity ? 'Nmap Scanning' : isTester ? 'Selenium Testing' : isCloud ? 'Kubernetes' : isMobile ? 'REST API Auth' : 'Workflows and Best Practices', careerGoal, learningFormat),
            },
            {
              id: uid('les'),
              title: isUIUX ? 'Intermediate Project: Interactive E-Commerce Prototype' : isSecurity ? 'Lab: Web Application Vulnerability Audit' : isTester ? 'Project: Complete Automated E2E Test Suite' : isCloud ? 'Project: Containerized Multi-Tier Web Architecture' : isMobile ? 'Project: Full-Stack Mobile CRUD App' : 'Intermediate Guided Project',
              description: 'Build a production-grade project using the tools you have mastered.',
              duration: '6 hr',
              completed: false,
              type: 'project' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'E-Commerce Prototype' : isSecurity ? 'Vulnerability Audit' : isTester ? 'E2E Testing Project' : isCloud ? 'Cloud Architecture Project' : isMobile ? 'Mobile App Project' : 'Intermediate Project', careerGoal, learningFormat),
            },
          ],
        },
      ],
    },
    {
      id: uid('stage'),
      number: 3,
      title: isUIUX
        ? 'Advanced UX Strategy & Capstone Portfolio'
        : isSecurity
        ? 'Security Auditing & Capstone Defense'
        : isTester
        ? 'CI/CD Test Automation & Performance'
        : isCloud
        ? 'DevOps Automation & Cloud Capstone'
        : isMobile
        ? 'App Store Deployment & Performance'
        : 'Advanced Concepts & Portfolio',
      description: 'Deepen your expertise, tackle complex real-world scenarios, and build a capstone.',
      estimatedWeeks: 4,
      modules: [
        {
          id: uid('mod'),
          title: isUIUX ? 'Advanced UX & Case Studies' : isSecurity ? 'Incident Response & SIEM' : isTester ? 'Performance & Pipeline Testing' : isCloud ? 'CI/CD & Infrastructure as Code' : isMobile ? 'Publishing & Optimization' : 'Advanced Skills',
          description: 'Level up with advanced techniques and capstone execution.',
          completed: false,
          expanded: false,
          lessons: [
            {
              id: uid('les'),
              title: isUIUX ? 'Accessibility (WCAG) & Dark Mode Systems' : isSecurity ? 'SIEM Log Analysis & Threat Detection' : isTester ? 'Performance Testing with k6 / Postman' : isCloud ? 'Terraform Infrastructure as Code' : isMobile ? 'Performance Profiling & Bundle Size Optimization' : 'Advanced Industry Topics',
              description: `Explore advanced ${careerGoal} challenges and architectural best practices.`,
              duration: '3 hr',
              completed: false,
              type: 'lesson' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'Accessibility WCAG' : isSecurity ? 'SIEM Log Analysis' : isTester ? 'Performance Testing' : isCloud ? 'Terraform' : isMobile ? 'Mobile Optimization' : 'Advanced Topics', careerGoal, learningFormat),
            },
            {
              id: uid('les'),
              title: 'Comprehensive Knowledge Checkpoint',
              description: 'Assess and validate your core competencies before portfolio finalization.',
              duration: '1 hr',
              completed: false,
              type: 'checkpoint' as const,
              resources: generateCuratedResourcesForLesson('Knowledge Checkpoint', careerGoal, learningFormat),
            },
            {
              id: uid('les'),
              title: isUIUX ? 'Capstone: Comprehensive UX Case Study & Portfolio' : isSecurity ? 'Capstone: Full Enterprise Security Audit Report' : isTester ? 'Capstone: Continuous Testing Pipeline for Web App' : isCloud ? 'Capstone: Automated Cloud Infrastructure Deployment' : isMobile ? 'Capstone: Production-Ready Mobile App for App Store' : `Capstone Portfolio Project for ${careerGoal}`,
              description: `Build a comprehensive project to showcase your ${careerGoal} skills to employers.`,
              duration: '8 hr',
              completed: false,
              type: 'project' as const,
              resources: generateCuratedResourcesForLesson(isUIUX ? 'UX Portfolio Case Study' : isSecurity ? 'Security Audit Report' : isTester ? 'CI/CD Test Pipeline' : isCloud ? 'Terraform Cloud Capstone' : isMobile ? 'App Store Deployment' : 'Capstone Project', careerGoal, learningFormat),
            },
          ],
        },
      ],
    },
  ];

  let totalLessons = 0;
  stages.forEach(s => s.modules.forEach(m => { totalLessons += m.lessons.length; }));

  return {
    id: pathId,
    title: `${careerGoal} Roadmap`,
    careerGoal,
    skillLevel,
    status: 'not-started',
    description: meta.description,
    stages,
    requiredSkills: meta.skills,
    estimatedDuration: '10–12 weeks',
    totalLessons,
    completedLessons: 0,
    hoursPerDay,
    targetWeeks,
    learningFormat,
    learningObjective,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    icon: meta.icon,
    color: meta.color,
  };
}

// ─── Public Generation Function ───────────────────────────────────────────────
/**
 * Generates a realistic mock learning path based on the provided onboarding data.
 * This function is intentionally isolated so it can later be replaced
 * with a real Gemini API call without changing the rest of the app.
 */
export async function generateLearningPath(data: {
  careerGoal: string;
  skillLevel: SkillLevel;
  hoursPerDay: number;
  targetWeeks: number;
  learningFormat: LearningFormat;
  learningObjective: LearningObjective;
}): Promise<LearningPath> {
  // Simulate network / AI generation delay
  await new Promise(resolve => setTimeout(resolve, 3500));

  const { careerGoal, skillLevel, hoursPerDay, targetWeeks, learningFormat, learningObjective } = data;

  switch (careerGoal) {
    case 'Full Stack Developer':
      return fullStackTemplate(skillLevel, hoursPerDay, targetWeeks, learningFormat, learningObjective);
    case 'AI/ML Engineer':
      return aiMlTemplate(skillLevel, hoursPerDay, targetWeeks, learningFormat, learningObjective);
    case 'Data Analyst':
      return dataAnalystTemplate(skillLevel, hoursPerDay, targetWeeks, learningFormat, learningObjective);
    default:
      return genericTemplate(careerGoal, skillLevel, hoursPerDay, targetWeeks, learningFormat, learningObjective);
  }
}
