
export enum QuestionType {
  MULTIPLE_CHOICE = 'Pilihan Ganda',
  ESSAY = 'Esai'
}

export enum ExamType {
  MCQ = 'Pilihan Ganda',
  TRUE_FALSE = 'Benar/Salah',
  MATCHING = 'Menjodohkan',
  SHORT_ANSWER = 'Isian Singkat',
  ESSAY = 'Uraian',
  CASE_STUDY = 'Studi Kasus',
  PRACTICAL = 'Praktik/Unjuk Kerja',
  PORTFOLIO = 'Portofolio',
  PROJECT = 'Project-based Assessment',
  ORAL = 'Penilaian Lisan',
  HOTS = 'Soal HOTS',
  MULTIMEDIA = 'Soal Berbasis Multimedia',
  MIXED = 'Campuran (Acak)'
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
  type: string; // Changed from literal union to string to accommodate flexible types
  taxonomy: string;
  difficulty: string;
  question_text: string;
  options?: string[]; // Used for MCQ, True/False, or Matching pairs
  correct_answer: string;
  explanation: string;
  image_description?: string; 
  image_url?: string; 
}

export interface ExamConfig {
  subject: string;
  gradeLevel: string;
  count: number;
  difficulty: Difficulty;
  examType: ExamType; 
  bloomLevels: string[]; 
  includeImages: boolean;
  contextText: string;
  cp: string; // Capaian Pembelajaran
  tp: string; // Tujuan Pembelajaran
  fileData?: {
    mimeType: string;
    data: string; 
  };
}
