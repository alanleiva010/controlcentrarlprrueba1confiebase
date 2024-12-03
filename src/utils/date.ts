import { formatISO, parseISO, isValid } from 'date-fns';

export const formatDate = (date: Date | string | null | undefined): string => {
  try {
    if (!date) return formatISO(new Date());
    
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsedDate) ? formatISO(parsedDate) : formatISO(new Date());
  } catch (error) {
    console.error('Error formatting date:', error);
    return formatISO(new Date());
  }
};

export const parseDate = (dateString: string | null | undefined): Date => {
  try {
    if (!dateString) return new Date();
    
    const parsedDate = parseISO(dateString);
    return isValid(parsedDate) ? parsedDate : new Date();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};