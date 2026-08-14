export interface Student {
  id: string;
  regNo: string;
  name: string;
  email: string;
  year: number;
  sectionId: string;
  academicYearId: string;
  // Note: NO parent phone number exposed to frontend for students
}
