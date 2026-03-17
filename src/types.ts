export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'instructor';
  unlockedLevel: number; // Current level in curriculum (1-50)
  streak: number;
  lastActivityDate?: string;
  createdAt: string;
}

export interface Disease {
  id: string;
  name: string;
  symptoms: string[];
  risk_factors: string[];
  diagnostic_tests: string[];
  treatment: string;
}

export interface Vitals {
  temp: number;
  bp: string;
  heartRate: number;
  respRate: number;
  o2: number;
}

export interface CaseTask {
  id: string;
  description: string;
  isCompleted: boolean;
}

export interface PatientCase {
  id: string;
  diseaseId: string;
  patientName: string;
  age: number;
  gender: string;
  severity: 'mild' | 'moderate' | 'severe';
  vitals: Vitals;
  chiefComplaint: string;
  history: string;
  status: 'active' | 'completed';
  studentId: string;
  type: 'curriculum' | 'daily' | 'practice';
  level?: number; // For curriculum cases
  chatLimit: number;
  chatCount: number;
  createdAt: string;
  tasks?: CaseTask[];
  lastAttemptId?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  caseId: string;
  role: 'student' | 'patient';
  content: string;
  timestamp: string;
}

export interface TestResult {
  id: string;
  caseId: string;
  testType: string;
  resultValue: string;
  isAbnormal: boolean;
  timestamp: string;
}

export interface StudentAttempt {
  id: string;
  userId: string;
  caseId: string;
  diagnosis: string;
  notes?: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  differentialDiagnosis?: string[];
  metrics: {
    accuracy: number;
    reasoning: number;
    efficiency: number;
    communication: number;
  };
  timestamp: string;
  timeSpent: number;
}
