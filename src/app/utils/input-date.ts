const withMissedZero = (value: number) => {
  return ("0" + value).slice(-2);
};

export const convertDateToString = (input: Date): string => {
  const date = withMissedZero(input.getDate());
  const month = withMissedZero(input.getMonth() + 1);
  const year = input.getFullYear();
  const hours = withMissedZero(input.getHours());
  const minutes = withMissedZero(input.getMinutes());
  return `${date}/${month}/${year} ${hours}:${minutes}`;
};

// Input format: dd/mm/yyyy hh:mm
export const convertStringToDate = (input: string): Date | null => {
  if (input.trim() === '') return null;
  const [
    date,
    month,
    year,
    hours,
    minutes
  ] = input.split(/[/\s:]/);
  if (!date || !month || !year || !hours || !minutes) throw new Error('Unexpected: Invalid date string');
  return new Date(`${month}/${date}/${year} ${hours}:${minutes}`);
};
