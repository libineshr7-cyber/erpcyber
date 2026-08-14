export interface MarkEntry {
  studentId: string;
  examId: string;
  subjectId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}
