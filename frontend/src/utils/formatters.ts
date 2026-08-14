import { format, parseISO } from 'date-fns';

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'MMM dd, yyyy');
};

export const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'MMM dd, yyyy h:mm a');
};

export const maskPhone = (phone: string) => {
  if (!phone) return '';
  return `+91 ******${phone.slice(-4)}`;
};
