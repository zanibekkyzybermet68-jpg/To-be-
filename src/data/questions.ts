export type GameModeId = 'mode1' | 'mode2' | 'mode3' | 'mode4' | 'mode5';

export interface ToBeQuestion {
  subject: string;
  complement: string;
  correct: 'AM' | 'IS' | 'ARE';
  options: Array<'AM' | 'IS' | 'ARE'>;
  explanation: string;
  words: string[];
  tf_statement: string;
  tf_is_correct: boolean;
}

export interface BalloonQuestion {
  id: string;
  subject: string;
  sentence: string;
  choices: [string, string];
  correctIndex: 0 | 1;
  explanation: string;
  ruleTag: string;
}

export interface GoldenQuestion {
  id: string;
  sentence: string;
  choices: [string, string];
  correctIndex: 0 | 1;
  explanation: string;
}

export interface SpeedQuestion {
  sentence: string;
  choices: [string, string];
  correctIndex: 0 | 1;
  explanation: string;
}

export interface BossQuestion {
  prompt: string;
  choices: string[];
  correct: string;
  explanation: string;
}

export interface DailyGoalHistoryEntry {
  date: string;
  solved: number;
  target: number;
}

export interface PlayerStats {
  highScore: number;
  totalScore: number;
  gamesPlayed: number;
  questionsSolved: number;
  bestStreak: number;
  perfectRuns: number;
  clearedLevel5: boolean;
  timedChallengesWon: number;
  unlockedAchievements: Record<string, boolean>;
  levelStars: Record<number, number>;
  coins: number;
  stars: number;
  goldenBalloonsMastered: number;
  dailyStreak: number;
  lastLoginDate: string;
  dailyQuestionsSolved: number;
  dailyGoalTarget: number;
  dailyGoalRewardClaimed: boolean;
  streakFreezes: number;
  unlockedLevel: number;
  dailyHistory: DailyGoalHistoryEntry[];
}

export const STREAK_FREEZE_COST = 50;
export const MAX_STREAK_FREEZES = 5;
export const LEVEL_UNLOCK_COIN_COST = 40;
export const LEVEL_UNLOCK_BONUS_COINS = 25;

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  condition: (s: PlayerStats) => boolean;
}

export const GAME_MODES: Array<{
  id: GameModeId;
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
}> = [
  {
    id: 'mode1',
    title: 'Mode 1: Choice',
    subtitle: 'Pick AM / IS / ARE',
    badge: 'Multiple Choice',
    accent: 'cyan',
  },
  {
    id: 'mode2',
    title: 'Mode 2: Fill Blank',
    subtitle: 'Slot the missing verb',
    badge: 'Direct Selection',
    accent: 'purple',
  },
  {
    id: 'mode3',
    title: 'Mode 3: Sentence',
    subtitle: 'Assemble word puzzle',
    badge: 'Syntax Builder',
    accent: 'emerald',
  },
  {
    id: 'mode4',
    title: 'Mode 4: True / False',
    subtitle: 'Spot grammar mistakes',
    badge: 'Grammar Radar',
    accent: 'pink',
  },
  {
    id: 'mode5',
    title: 'Mode 5: Timed Blitz',
    subtitle: '15s countdown clock',
    badge: 'Speed Blitz',
    accent: 'amber',
  },
];

export const DIFFICULTY_LEVELS: Array<{
  level: number;
  name: string;
  subtitle: string;
  starsDisplay: string;
}> = [
  { level: 1, name: 'Easy', subtitle: 'Pronouns I, He, You, She, It', starsDisplay: '★☆☆☆☆' },
  { level: 2, name: 'Beginner', subtitle: 'Singular & Plural Everyday Nouns', starsDisplay: '★★☆☆☆' },
  { level: 3, name: 'Medium', subtitle: 'Compound Subjects & Occupations', starsDisplay: '★★★☆☆' },
  { level: 4, name: 'Hard', subtitle: 'Questions, Negatives & Inverted Syntax', starsDisplay: '★★★★☆' },
  { level: 5, name: 'Master', subtitle: 'Collective Nouns & Tricky Agreement', starsDisplay: '★★★★★' },
];

export const QUESTION_BANK: Record<number, ToBeQuestion[]> = {
  1: [
    {
      subject: 'I',
      complement: 'a student.',
      correct: 'AM',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Use 'AM' exclusively with the first-person singular pronoun 'I'.",
      words: ['I', 'am', 'a', 'student.'],
      tf_statement: 'I is a student.',
      tf_is_correct: false,
    },
    {
      subject: 'He',
      complement: 'my best friend.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'He' is third-person singular and takes 'IS'.",
      words: ['He', 'is', 'my', 'best', 'friend.'],
      tf_statement: 'He is my best friend.',
      tf_is_correct: true,
    },
    {
      subject: 'You',
      complement: 'very kind.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'You' always takes the verb 'ARE' in both singular and plural.",
      words: ['You', 'are', 'very', 'kind.'],
      tf_statement: 'You am very kind.',
      tf_is_correct: false,
    },
    {
      subject: 'She',
      complement: 'a talented singer.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'She' is singular and requires 'IS'.",
      words: ['She', 'is', 'a', 'talented', 'singer.'],
      tf_statement: 'She is a talented singer.',
      tf_is_correct: true,
    },
    {
      subject: 'It',
      complement: 'a sunny afternoon.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'It' refers to a single object or weather condition and uses 'IS'.",
      words: ['It', 'is', 'a', 'sunny', 'afternoon.'],
      tf_statement: 'It are a sunny afternoon.',
      tf_is_correct: false,
    },
    {
      subject: 'We',
      complement: 'ready to play.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'We' is plural (two or more people) and requires 'ARE'.",
      words: ['We', 'are', 'ready', 'to', 'play.'],
      tf_statement: 'We are ready to play.',
      tf_is_correct: true,
    },
    {
      subject: 'They',
      complement: 'in the classroom.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'They' refers to multiple individuals, so use 'ARE'.",
      words: ['They', 'are', 'in', 'the', 'classroom.'],
      tf_statement: 'They is in the classroom.',
      tf_is_correct: false,
    },
    {
      subject: 'I',
      complement: 'happy today.',
      correct: 'AM',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Always say 'I AM' when describing your own feelings.",
      words: ['I', 'am', 'happy', 'today.'],
      tf_statement: 'I am happy today.',
      tf_is_correct: true,
    },
    {
      subject: 'He',
      complement: 'tall and strong.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'He' is singular third-person and takes 'IS'.",
      words: ['He', 'is', 'tall', 'and', 'strong.'],
      tf_statement: 'He are tall and strong.',
      tf_is_correct: false,
    },
    {
      subject: 'You',
      complement: 'a great gamer.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'You' is always accompanied by 'ARE'.",
      words: ['You', 'are', 'a', 'great', 'gamer.'],
      tf_statement: 'You are a great gamer.',
      tf_is_correct: true,
    },
  ],
  2: [
    {
      subject: 'The dog',
      complement: 'barking loudly.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The dog' is one animal (singular 'it'), so use 'IS'.",
      words: ['The', 'dog', 'is', 'barking', 'loudly.'],
      tf_statement: 'The dog is barking loudly.',
      tf_is_correct: true,
    },
    {
      subject: 'The cars',
      complement: 'very fast.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The cars' is plural ('they'), so use 'ARE'.",
      words: ['The', 'cars', 'are', 'very', 'fast.'],
      tf_statement: 'The cars is very fast.',
      tf_is_correct: false,
    },
    {
      subject: 'My sister',
      complement: 'at the library.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'My sister' represents 'she', which takes 'IS'.",
      words: ['My', 'sister', 'is', 'at', 'the', 'library.'],
      tf_statement: 'My sister is at the library.',
      tf_is_correct: true,
    },
    {
      subject: 'I',
      complement: 'doing my homework.',
      correct: 'AM',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Use 'AM' with 'I'.",
      words: ['I', 'am', 'doing', 'my', 'homework.'],
      tf_statement: 'I are doing my homework.',
      tf_is_correct: false,
    },
    {
      subject: 'The books',
      complement: 'on the shelf.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The books' is plural, which takes 'ARE'.",
      words: ['The', 'books', 'are', 'on', 'the', 'shelf.'],
      tf_statement: 'The books are on the shelf.',
      tf_is_correct: true,
    },
    {
      subject: 'The apple',
      complement: 'red and sweet.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The apple' is a single fruit ('it'), taking 'IS'.",
      words: ['The', 'apple', 'is', 'red', 'and', 'sweet.'],
      tf_statement: 'The apple are red and sweet.',
      tf_is_correct: false,
    },
    {
      subject: 'We',
      complement: 'learning English.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'We' takes 'ARE'.",
      words: ['We', 'are', 'learning', 'English.'],
      tf_statement: 'We are learning English.',
      tf_is_correct: true,
    },
    {
      subject: 'The sun',
      complement: 'shining bright.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The sun' is a singular noun ('it') and pairs with 'IS'.",
      words: ['The', 'sun', 'is', 'shining', 'bright.'],
      tf_statement: 'The sun is shining bright.',
      tf_is_correct: true,
    },
    {
      subject: 'Those birds',
      complement: 'flying south.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Those birds' is plural, requiring 'ARE'.",
      words: ['Those', 'birds', 'are', 'flying', 'south.'],
      tf_statement: 'Those birds is flying south.',
      tf_is_correct: false,
    },
    {
      subject: 'It',
      complement: 'cold outside.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'It' pairs with 'IS' for weather.",
      words: ['It', 'is', 'cold', 'outside.'],
      tf_statement: 'It is cold outside.',
      tf_is_correct: true,
    },
  ],
  3: [
    {
      subject: 'Tom and Jerry',
      complement: 'famous cartoon characters.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Two subjects joined by 'and' become plural ('they') and need 'ARE'.",
      words: ['Tom', 'and', 'Jerry', 'are', 'famous', 'cartoons.'],
      tf_statement: 'Tom and Jerry is famous characters.',
      tf_is_correct: false,
    },
    {
      subject: 'The doctor',
      complement: 'helping the patient.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The doctor' is one person (he/she), so we use 'IS'.",
      words: ['The', 'doctor', 'is', 'helping', 'the', 'patient.'],
      tf_statement: 'The doctor is helping the patient.',
      tf_is_correct: true,
    },
    {
      subject: 'My parents',
      complement: 'proud of me.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Parents' refers to both mother and father, a plural subject taking 'ARE'.",
      words: ['My', 'parents', 'are', 'proud', 'of', 'me.'],
      tf_statement: 'My parents is proud of me.',
      tf_is_correct: false,
    },
    {
      subject: 'I',
      complement: 'the team captain.',
      correct: 'AM',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Subject 'I' demands 'AM'.",
      words: ['I', 'am', 'the', 'team', 'captain.'],
      tf_statement: 'I am the team captain.',
      tf_is_correct: true,
    },
    {
      subject: 'Sarah',
      complement: 'an excellent artist.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Sarah' is a singular name ('she') and takes 'IS'.",
      words: ['Sarah', 'is', 'an', 'excellent', 'artist.'],
      tf_statement: 'Sarah are an excellent artist.',
      tf_is_correct: false,
    },
    {
      subject: 'The children',
      complement: 'playing in the garden.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Children' is the irregular plural form of child ('they'), requiring 'ARE'.",
      words: ['The', 'children', 'are', 'playing', 'in', 'the', 'garden.'],
      tf_statement: 'The children are playing in the garden.',
      tf_is_correct: true,
    },
    {
      subject: 'This computer',
      complement: 'very fast.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'This computer' is a single machine ('it') and needs 'IS'.",
      words: ['This', 'computer', 'is', 'very', 'fast.'],
      tf_statement: 'This computer are very fast.',
      tf_is_correct: false,
    },
    {
      subject: 'You and I',
      complement: 'good partners.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'You and I' equals 'We' (plural), which takes 'ARE'. Don't be tricked by 'I'!",
      words: ['You', 'and', 'I', 'are', 'good', 'partners.'],
      tf_statement: 'You and I am good partners.',
      tf_is_correct: false,
    },
    {
      subject: 'The music',
      complement: 'very relaxing.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Music' is an uncountable singular noun, so it takes 'IS'.",
      words: ['The', 'music', 'is', 'very', 'relaxing.'],
      tf_statement: 'The music is very relaxing.',
      tf_is_correct: true,
    },
    {
      subject: 'The players',
      complement: 'on the court.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The players' is plural, requiring 'ARE'.",
      words: ['The', 'players', 'are', 'on', 'the', 'court.'],
      tf_statement: 'The players are on the court.',
      tf_is_correct: true,
    },
  ],
  4: [
    {
      subject: '___ she',
      complement: 'at home right now?',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "In questions, the verb comes first. With 'she', the question starts with 'IS'.",
      words: ['Is', 'she', 'at', 'home', 'right', 'now?'],
      tf_statement: 'Is she at home right now?',
      tf_is_correct: true,
    },
    {
      subject: '___ you',
      complement: 'ready for the test?',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Questions with 'you' must start with 'ARE'.",
      words: ['Are', 'you', 'ready', 'for', 'the', 'test?'],
      tf_statement: 'Is you ready for the test?',
      tf_is_correct: false,
    },
    {
      subject: 'Where ___',
      complement: 'my keys?',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Keys' is plural, so the WH-question requires 'ARE'.",
      words: ['Where', 'are', 'my', 'keys?'],
      tf_statement: 'Where is my keys?',
      tf_is_correct: false,
    },
    {
      subject: 'Who ___',
      complement: 'that person over there?',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'That person' is singular ('he/she'), so use 'IS'.",
      words: ['Who', 'is', 'that', 'person', 'over', 'there?'],
      tf_statement: 'Who is that person over there?',
      tf_is_correct: true,
    },
    {
      subject: 'I ___ not',
      complement: 'afraid of challenges.',
      correct: 'AM',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'I' combines with 'AM' in negative sentences ('I am not').",
      words: ['I', 'am', 'not', 'afraid', 'of', 'challenges.'],
      tf_statement: 'I am not afraid of challenges.',
      tf_is_correct: true,
    },
    {
      subject: 'The weather',
      complement: 'not very nice today.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'The weather' is singular, requiring 'IS'.",
      words: ['The', 'weather', 'is', 'not', 'very', 'nice', 'today.'],
      tf_statement: 'The weather are not very nice today.',
      tf_is_correct: false,
    },
    {
      subject: '___ I',
      complement: 'in the right place?',
      correct: 'AM',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Questions with 'I' begin with 'AM' ('Am I in the right place?').",
      words: ['Am', 'I', 'in', 'the', 'right', 'place?'],
      tf_statement: 'Am I in the right place?',
      tf_is_correct: true,
    },
    {
      subject: 'These shoes',
      complement: 'too tight.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'These shoes' is plural, taking 'ARE'.",
      words: ['These', 'shoes', 'are', 'too', 'tight.'],
      tf_statement: 'These shoes is too tight.',
      tf_is_correct: false,
    },
    {
      subject: 'There ___',
      complement: 'a bird in the tree.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "In 'There is/are', look at the noun following: 'a bird' is singular, so use 'IS'.",
      words: ['There', 'is', 'a', 'bird', 'in', 'the', 'tree.'],
      tf_statement: 'There is a bird in the tree.',
      tf_is_correct: true,
    },
    {
      subject: 'There ___',
      complement: 'five apples on the table.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Five apples' is plural, so we say 'There ARE five apples'.",
      words: ['There', 'are', 'five', 'apples', 'on', 'the', 'table.'],
      tf_statement: 'There is five apples on the table.',
      tf_is_correct: false,
    },
  ],
  5: [
    {
      subject: 'Everybody',
      complement: 'invited to the party.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Indefinite pronouns like 'everybody' or 'everyone' are grammatically singular and take 'IS'.",
      words: ['Everybody', 'is', 'invited', 'to', 'the', 'party.'],
      tf_statement: 'Everybody are invited to the party.',
      tf_is_correct: false,
    },
    {
      subject: 'Neither my brother nor my sisters',
      complement: 'here.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "With 'neither... nor...', the verb agrees with the closer subject ('sisters' is plural -> ARE).",
      words: ['Neither', 'my', 'brother', 'nor', 'my', 'sisters', 'are', 'here.'],
      tf_statement: 'Neither my brother nor my sisters are here.',
      tf_is_correct: true,
    },
    {
      subject: 'The police',
      complement: 'investigating the incident.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Police' is a plural collective noun in standard English and takes 'ARE'.",
      words: ['The', 'police', 'are', 'investigating', 'the', 'incident.'],
      tf_statement: 'The police is investigating the incident.',
      tf_is_correct: false,
    },
    {
      subject: 'The news',
      complement: 'surprising to all.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Although 'news' ends in 's', it is an uncountable singular noun and takes 'IS'.",
      words: ['The', 'news', 'is', 'surprising', 'to', 'all.'],
      tf_statement: 'The news is surprising to all.',
      tf_is_correct: true,
    },
    {
      subject: 'Both of them',
      complement: 'ready for battle.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'Both' always refers to two items/people and requires 'ARE'.",
      words: ['Both', 'of', 'them', 'are', 'ready', 'for', 'battle.'],
      tf_statement: 'Both of them is ready for battle.',
      tf_is_correct: false,
    },
    {
      subject: 'One of the boys',
      complement: 'missing from class.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "The core subject is 'One' (singular), not 'boys'. Therefore it takes 'IS'.",
      words: ['One', 'of', 'the', 'boys', 'is', 'missing.'],
      tf_statement: 'One of the boys is missing.',
      tf_is_correct: true,
    },
    {
      subject: 'Mathematics',
      complement: 'my favorite subject.',
      correct: 'IS',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Academic fields like Mathematics or Physics ending in 's' take singular 'IS'.",
      words: ['Mathematics', 'is', 'my', 'favorite', 'subject.'],
      tf_statement: 'Mathematics are my favorite subject.',
      tf_is_correct: false,
    },
    {
      subject: 'A number of students',
      complement: 'waiting outside.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "'A number of [plural noun]' means 'many' and takes plural 'ARE'.",
      words: ['A', 'number', 'of', 'students', 'are', 'waiting.'],
      tf_statement: 'A number of students are waiting.',
      tf_is_correct: true,
    },
    {
      subject: 'My scissors',
      complement: 'sharp.',
      correct: 'ARE',
      options: ['AM', 'IS', 'ARE'],
      explanation: "Tools with two parts (scissors, glasses, trousers) are plural and take 'ARE'.",
      words: ['My', 'scissors', 'are', 'sharp.'],
      tf_statement: 'My scissors is sharp.',
      tf_is_correct: false,
    },
    {
      subject: 'I, who ___ your mentor,',
      complement: 'will guide you.',
      correct: 'AM',
      options: ['AM', 'IS', 'ARE'],
      explanation: "In relative clauses modifying 'I', the verb agrees with 'I', taking 'AM'.",
      words: ['I', 'am', 'your', 'mentor', 'today.'],
      tf_statement: 'I am your mentor today.',
      tf_is_correct: true,
    },
  ],
};

export const BALLOON_QUESTIONS: BalloonQuestion[] = [
  {
    id: 'b1',
    subject: 'The friendly puppy',
    sentence: 'The friendly puppy ______ every morning in the sunny yard.',
    choices: ['barks', 'bark'],
    correctIndex: 0,
    explanation: "'Puppy' is ONE singular subject! So we add -s to the verb: 'barks'.",
    ruleTag: 'Singular Subject (+s)',
  },
  {
    id: 'b2',
    subject: 'Two hungry kittens',
    sentence: 'Two hungry kittens ______ warm milk from the saucer.',
    choices: ['drinks', 'drink'],
    correctIndex: 1,
    explanation: "'Two kittens' is PLURAL (more than one), so we use the base verb 'drink' without -s.",
    ruleTag: 'Plural Subject (Base Verb)',
  },
  {
    id: 'b3',
    subject: 'The clever astronaut',
    sentence: 'The clever astronaut ______ across the silver moon.',
    choices: ['walks', 'walk'],
    correctIndex: 0,
    explanation: "'Astronaut' is singular! Singular subjects match with 'walks'.",
    ruleTag: 'Singular Subject (+s)',
  },
  {
    id: 'b4',
    subject: 'The shiny rockets',
    sentence: 'The shiny rockets ______ through the stars at lightning speed.',
    choices: ['zooms', 'zoom'],
    correctIndex: 1,
    explanation: "'Rockets' is plural! Plural subjects take the base form 'zoom'.",
    ruleTag: 'Plural Subject (Base Verb)',
  },
  {
    id: 'b5',
    subject: 'My brother and sister',
    sentence: 'My brother and sister ______ chocolate chip cookies.',
    choices: ['bakes', 'bake'],
    correctIndex: 1,
    explanation: "Compound subject joined by 'and' is plural! They 'bake' together.",
    ruleTag: 'Compound Subject (AND)',
  },
  {
    id: 'b6',
    subject: 'The wise old turtle',
    sentence: 'The wise old turtle ______ slowly down to the pond.',
    choices: ['crawls', 'crawl'],
    correctIndex: 0,
    explanation: "'Turtle' is one creature (singular). We add -s: 'crawls'.",
    ruleTag: 'Singular Subject (+s)',
  },
  {
    id: 'b7',
    subject: 'The cheerful dolphins',
    sentence: 'The cheerful dolphins ______ high above the ocean waves.',
    choices: ['leaps', 'leap'],
    correctIndex: 1,
    explanation: "'Dolphins' is plural, so we use the base verb 'leap'.",
    ruleTag: 'Plural Subject (Base Verb)',
  },
  {
    id: 'b8',
    subject: 'Captain Nova',
    sentence: 'Captain Nova ______ the starship through the nebula.',
    choices: ['pilots', 'pilot'],
    correctIndex: 0,
    explanation: "'Captain Nova' is one person (singular), so we use 'pilots'.",
    ruleTag: 'Singular Subject (+s)',
  },
];

export const GOLDEN_QUESTIONS: GoldenQuestion[] = [
  {
    id: 'g1',
    sentence: 'The golden lions and swift cheetahs ______ across the sunny savanna!',
    choices: ['runs', 'run'],
    correctIndex: 1,
    explanation: "Two animals joined by 'and' make a compound plural subject, so we use 'run'!",
  },
  {
    id: 'g2',
    sentence: 'A sparkling unicorn ______ rainbow sprinkles over the magical clouds!',
    choices: ['spreads', 'spread'],
    correctIndex: 0,
    explanation: "'A sparkling unicorn' is ONE singular creature! Therefore, add -s: 'spreads'!",
  },
  {
    id: 'g3',
    sentence: 'The royal golden king and his dragon ______ together every Friday!',
    choices: ['dances', 'dance'],
    correctIndex: 1,
    explanation: "'The king and his dragon' is plural! Plural subjects use 'dance'!",
  },
  {
    id: 'g4',
    sentence: 'Every golden star in the galaxy ______ like a brilliant diamond.',
    choices: ['glows', 'glow'],
    correctIndex: 0,
    explanation: "'Every star' is grammatically singular! So the verb takes an -s: 'glows'.",
  },
  {
    id: 'g5',
    sentence: 'The royal wizards and magical elves ______ potions in the crystal tower!',
    choices: ['brews', 'brew'],
    correctIndex: 1,
    explanation: 'Wizards AND elves is plural! Plural subjects use the base verb "brew".',
  },
  {
    id: 'g6',
    sentence: 'A shiny golden peacock ______ its feathers in the royal courtyard.',
    choices: ['fans', 'fan'],
    correctIndex: 0,
    explanation: "'A shiny peacock' is singular! Singular subjects take an -s: 'fans'.",
  },
];

export const SPEED_RUSH_QUESTIONS: SpeedQuestion[] = [
  {
    sentence: 'The curious kittens ______ into the basket.',
    choices: ['climbs', 'climb'],
    correctIndex: 1,
    explanation: 'Plural subject "kittens" takes base verb "climb".',
  },
  {
    sentence: 'My best friend ______ funny comics.',
    choices: ['draws', 'draw'],
    correctIndex: 0,
    explanation: 'Singular subject "friend" takes "draws".',
  },
  {
    sentence: 'The silver airplane ______ above the clouds.',
    choices: ['soars', 'soar'],
    correctIndex: 0,
    explanation: 'Singular subject "airplane" takes "soars".',
  },
  {
    sentence: 'Three little ducks ______ in the pond.',
    choices: ['swims', 'swim'],
    correctIndex: 1,
    explanation: 'Plural subject "ducks" takes "swim".',
  },
  {
    sentence: 'The red race car ______ super fast.',
    choices: ['goes', 'go'],
    correctIndex: 0,
    explanation: 'Singular subject "race car" takes "goes".',
  },
  {
    sentence: 'Frogs and toads ______ loudly at night.',
    choices: ['croaks', 'croak'],
    correctIndex: 1,
    explanation: 'Compound subject "Frogs and toads" takes "croak".',
  },
  {
    sentence: 'She ______ the guitar in a rock band.',
    choices: ['plays', 'play'],
    correctIndex: 0,
    explanation: 'Singular pronoun "She" takes "plays".',
  },
  {
    sentence: 'We ______ ready for the championship.',
    choices: ['is', 'are'],
    correctIndex: 1,
    explanation: 'Plural pronoun "We" takes "are".',
  },
];

export const BOSS_QUESTIONS: BossQuestion[] = [
  {
    prompt: 'Neither the commander nor the cadets ______ aware of the secret code.',
    choices: ['is', 'are', 'am'],
    correct: 'are',
    explanation: 'With "neither... nor", match the verb to the closer subject ("cadets" -> plural "are").',
  },
  {
    prompt: 'Every one of the golden trophies ______ polished before the ceremony.',
    choices: ['is', 'are', 'were'],
    correct: 'is',
    explanation: '"Every one" is singular and requires the singular verb "is".',
  },
  {
    prompt: 'The fleet of starships ______ orbiting the neon planet right now.',
    choices: ['is', 'are', 'am'],
    correct: 'is',
    explanation: 'The collective head noun "fleet" is singular, so it takes "is".',
  },
  {
    prompt: 'Physics ______ one of Professor Verb’s toughest university challenges.',
    choices: ['is', 'are', 'am'],
    correct: 'is',
    explanation: 'Academic subjects ending in -s like "Physics" are singular and take "is".',
  },
  {
    prompt: 'You and I ______ the top grammar champions in Sector 7!',
    choices: ['am', 'is', 'are'],
    correct: 'are',
    explanation: '"You and I" forms a plural compound subject equivalent to "We", taking "are".',
  },
];

export const CARTOON_FLOAT_REACTIONS = [
  { text: 'Wheee! Balloons incoming!', speech: 'Wheee!', pattern: 'up' as const },
  { text: 'Yippee! Pop the right verb!', speech: 'Yippee!', pattern: 'wave' as const },
  { text: 'Woohoo! Look at the subject!', speech: 'Woohoo!', pattern: 'up' as const },
  { text: 'Boing! Up in the sky!', speech: 'Boing! Up in the sky!', pattern: 'wave' as const },
];

export const CARTOON_WRONG_REACTIONS = [
  { text: 'Boing! Wrong balloon!', speech: 'Boing! Try the other balloon!', soundType: 'boing' as const },
  { text: 'Womp womp! Check the subject!', speech: 'Womp womp! Almost had it!', soundType: 'womp' as const },
  { text: 'Pffft! Balloon deflated!', speech: 'Oopsie! That balloon deflated!', soundType: 'deflate' as const },
  { text: 'Quack! Singular vs Plural!', speech: 'Quack quack! Check the rule!', soundType: 'quack' as const },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_win',
    title: 'First Launch',
    desc: 'Complete your first grammar mission',
    icon: '🌱',
    condition: (s) => s.gamesPlayed >= 1,
  },
  {
    id: 'score_100',
    title: 'Century Club',
    desc: 'Reach 100 total score points across missions',
    icon: '💯',
    condition: (s) => s.totalScore >= 100,
  },
  {
    id: 'perfect_10',
    title: 'Flawless Grammar',
    desc: 'Score 10/10 in any difficulty level',
    icon: '⭐',
    condition: (s) => s.perfectRuns >= 1,
  },
  {
    id: 'streak_5',
    title: 'Combo Master',
    desc: 'Achieve a 5-question answer streak',
    icon: '🔥',
    condition: (s) => s.bestStreak >= 5,
  },
  {
    id: 'master_lvl5',
    title: 'Grand Master',
    desc: 'Conquer Level 5 Master questions',
    icon: '👑',
    condition: (s) => s.clearedLevel5,
  },
  {
    id: 'speed_runner',
    title: 'Speed Demon',
    desc: 'Complete a Timed Blitz challenge',
    icon: '⚡',
    condition: (s) => s.timedChallengesWon >= 1,
  },
  {
    id: 'golden_5',
    title: 'Golden Firework Sovereign',
    desc: 'Master 5 Bonus Golden Balloons in Subject-Verb Pop',
    icon: '🎆',
    condition: (s) => s.goldenBalloonsMastered >= 5,
  },
];

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  highScore: 0,
  totalScore: 0,
  gamesPlayed: 0,
  questionsSolved: 0,
  bestStreak: 0,
  perfectRuns: 0,
  clearedLevel5: false,
  timedChallengesWon: false ? 1 : 0,
  unlockedAchievements: {},
  levelStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  coins: 120,
  stars: 6,
  goldenBalloonsMastered: 0,
  dailyStreak: 1,
  lastLoginDate: '',
  dailyQuestionsSolved: 0,
  dailyGoalTarget: 10,
  dailyGoalRewardClaimed: false,
  streakFreezes: 1,
  unlockedLevel: 1,
  dailyHistory: [],
};
