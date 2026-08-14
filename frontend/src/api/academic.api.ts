import { api } from './client';
import { AcademicYear, Semester, Section } from '../types/academic.types';

export const academicApi = {
  getYears: () => api.get<AcademicYear[]>('/academic/years'),
  getSemesters: () => api.get<Semester[]>('/academic/semesters'),
  getSections: () => api.get<Section[]>('/academic/sections'),
};
