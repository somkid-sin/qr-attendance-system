/** student_id is a 13-digit text field per data-dictionary.md (Sheet 1: students). */
export function isValidStudentId(studentId: string): boolean {
  return /^\d{13}$/.test(studentId);
}
