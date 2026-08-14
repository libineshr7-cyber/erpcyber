export interface Report {
  id: string;
  studentId: string;
  examId: string;
  generatedDate: string;
  status: 'APPROVED' | 'PENDING';
  downloadUrl: string;
}
