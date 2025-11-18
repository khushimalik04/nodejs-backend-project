import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const comparePasswords = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Get current time in IST timezone
 * @returns Current IST time formatted as YYYY-MM-DDTHH:mm:ssZ
 */
export const getCurrentISTTime = (): string => {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
};

/**
 * Format date/time to IST timezone
 * @param date - Date object or date string
 * @returns Date in IST formatted as YYYY-MM-DDTHH:mm:ssZ
 */
export const formatToIST = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const istDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
};

/**
 * Convert user input time to IST format
 * Time is treated literally as IST (Z suffix ignored)
 */
export const toISTTime = (dateString: string): string => {
  return dateString;
};

/**
 * Validate if date string is in correct format
 * @param dateString - ISO date string to validate
 * @returns True if format is YYYY-MM-DDTHH:mm:ssZ
 */
export const isISTFormat = (dateString: string): boolean => {
  try {
    const isoFormatPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

    if (!isoFormatPattern.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};
