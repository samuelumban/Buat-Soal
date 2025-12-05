export enum QuestionType {
  MULTIPLE_CHOICE = 'Pilihan Ganda',
  ESSAY = 'Esai'
}

export enum ExamType {
  MCQ = 'Pilihan Ganda (Semua)',
  ESSAY = 'Uraian / Esai (Semua)',
  MIXED = 'Campuran (PG & Esai)'
}

export enum BloomLevel {
  C1 = 'C1 - Mengingat',
  C2 = 'C2 - Memahami',
  C3 = 'C3 - Menerapkan',
  C4 = 'C4 - Menganalisis',
  C5 = 'C5 - Mengevaluasi',
  C6 = 'C6 - Mencipta'
}

export enum Difficulty {
  EASY = 'Mudah',
  MEDIUM = 'Sedang',
  HARD = 'Sulit'
}

export interface Question {
  id: number;
  type: 'mcq' | 'essay';
  taxonomy: string;
  difficulty: string;
  question_text: string;
  options?: string[]; // For MCQ, should be 5 options (a-e)
  correct_answer: string;
  explanation: string;
  image_description?: string; // If the AI suggests an image
  image_url?: string; // The generated base64 image
}

export interface ExamConfig {
  subject: string;
  gradeLevel: string; // e.g., "Kelas 10 SMA"
  count: number;
  difficulty: Difficulty;
  examType: ExamType; // Added field
  bloomLevels: string[]; // Selected bloom levels
  includeImages: boolean;
  contextText: string;
  fileData?: {
    mimeType: string;
    data: string; // base64
  };
}