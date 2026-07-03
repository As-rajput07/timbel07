export const isUniversityEmail = (email) => {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return lowerEmail.endsWith('.ac.in') || 
         lowerEmail.endsWith('.edu') || 
         lowerEmail.endsWith('.edu.in');
};
