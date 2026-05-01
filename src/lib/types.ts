export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface Visitor {
  id: number;           // prospectId devuelto por el backend
  firstName: string;
  lastName: string;
  contact?: string;
  notes?: string;
  registeredAt: string; // ISO string del momento del registro local
  addedByName: string;  // nombre del miembro que lo registró
}

export interface AuthState {
  token: string;
  memberId: number;
  memberName: string;
}
