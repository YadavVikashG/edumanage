import { SCHOOL_GRADES } from "@/lib/school-options";

export const STANDARD_SUBJECTS = [
  "English",
  "Mathematics",
  "Science",
  "Environmental Studies",
  "Social Studies",
  "Hindi",
  "Second Language",
  "Computer Science",
  "General Knowledge",
  "Art",
  "Music",
  "Physical Education",
  "Moral Education",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Economics",
  "Civics",
] as const;

export function isStandardSubject(name: string) {
  return STANDARD_SUBJECTS.includes(name as (typeof STANDARD_SUBJECTS)[number]);
}

export { SCHOOL_GRADES };