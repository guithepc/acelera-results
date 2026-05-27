export type AlunoArea =
  | 'FRONTEND'
  | 'BACKEND'
  | 'FULLSTACK'
  | 'MOBILE'
  | 'CYBER'
  | 'DATA'
  | 'DEVOPS';

export type AlunoGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AlunoGlobe {
  id: string;
  anonymousName: string;
  area: AlunoArea;
  lat: number;
  lng: number;
  avatarUrl: string;
}

export interface AlunoCard {
  id: string;
  anonymousName: string;
  avatarUrl: string;
  area: AlunoArea;
  city: string;
  state: string;
  salary: string;
  firstJobInIt: boolean;
  keyInsight: string;
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
