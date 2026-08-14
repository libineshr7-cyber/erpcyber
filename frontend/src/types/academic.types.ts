export interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
}
export interface Semester {
  id: string;
  name: string;
  year: number;
}
export interface Section {
  id: string;
  name: string; // A, B, C
}
export interface Subject {
  id: string;
  code: string;
  name: string;
  semesterId: string;
}
export interface Exam {
  id: string;
  name: string;
  maxMarks: number;
}
