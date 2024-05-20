export const convertDateToString = (input: Date): string => {
  const [
    year,
    month,
    day,
    hours,
    minutes
  ] = input.toJSON().split(/[-T:]/);
  if (!day || !month || !year || !hours || !minutes) throw new Error('Unexpected: Invalid date');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Format: dd/mm/yyyy hh:mm
export const convertStringToDate = (input: string): Date | null => {
  if (input.trim() === '') return null;
  const [
    day,
    month,
    year,
    hours,
    minutes
  ] = input.split(/[/\s:]/);
  if (!day || !month || !year || !hours || !minutes) throw new Error('Unexpected: Invalid date string');
  return new Date(`${month}/${day}/${year} ${hours}:${minutes}`);
};
