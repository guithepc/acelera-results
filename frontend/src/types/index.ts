export type StudentArea =
  | 'FRONTEND'
  | 'BACKEND'
  | 'FULLSTACK'
  | 'MOBILE'
  | 'CYBER'
  | 'DATA'
  | 'DEVOPS'
  | 'QA'
  | 'IA_AUTOMACOES'
  | 'SUPORTE';

export type StudentGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface StudentGlobe {
  id: string;
  anonymousName: string;
  area: StudentArea;
  lat: number;
  lng: number;
  avatarUrl: string;
}

export type StudentSeniority =
  | 'TRAINEE'
  | 'ESTAGIO'
  | 'JUNIOR'
  | 'PLENO'
  | 'SENIOR'
  | 'ASSISTENTE';

export interface StudentCard {
  id: string;
  anonymousName: string;
  avatarUrl: string;
  area: StudentArea;
  seniority: StudentSeniority | null;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
  stacks: string | null;
  courseTime: string | null;
}

export interface StudentAdmin extends StudentCard {
  gender: StudentGender;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface Stats {
  total: number;
  states: number;
}

export interface CreateStudentRequest {
  area: StudentArea;
  gender: StudentGender;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
}
