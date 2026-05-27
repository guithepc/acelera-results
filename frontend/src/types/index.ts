export type AlunoArea =
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

export type AlunoGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AlunoGlobe {
  id: string;
  anonymousName: string;
  area: AlunoArea;
  lat: number;
  lng: number;
  avatarUrl: string;
}

export type AlunoSeniority =
  | 'TRAINEE'
  | 'ESTAGIO'
  | 'JUNIOR'
  | 'PLENO'
  | 'SENIOR'
  | 'ASSISTENTE';

export interface AlunoCard {
  id: string;
  anonymousName: string;
  avatarUrl: string;
  area: AlunoArea;
  seniority: AlunoSeniority | null;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
  stacks: string | null;
}

export interface AlunoAdmin extends AlunoCard {
  gender: AlunoGender;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface Stats {
  total: number;
  states: number;
}

export interface CreateAlunoRequest {
  area: AlunoArea;
  gender: AlunoGender;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
}
