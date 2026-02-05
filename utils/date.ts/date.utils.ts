import {
    format,
    parseISO,
    differenceInDays,
    addDays,
    subDays,
    isBefore,
    isAfter,
    isEqual,
    isToday,
    isWeekend,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    formatDistanceToNow,
  } from 'date-fns';
  
  export class DateUtils {
    /**
     * Formats a Date object into a string based on the given pattern.
     * @param date - The date to format
     * @param pattern - The format pattern (default is 'yyyy-MM-dd')
     * @returns Formatted date string
     */
    static formatDate(date: Date, pattern: string = 'yyyy-MM-dd'): string {
      return format(date, pattern);
    }
  
    /**
     * Parses an ISO string into a Date object.
     * @param dateStr - ISO date string
     * @returns Parsed Date object
     */
    static parseDate(dateStr: string): Date {
      return parseISO(dateStr);
    }
  
    /**
     * Calculates the number of days between two dates.
     * @param date1 - First date
     * @param date2 - Second date
     * @returns Number of days between date1 and date2
     */
    static daysBetween(date1: Date, date2: Date): number {
      return differenceInDays(date1, date2);
    }
  
    /**
     * Adds a number of days to a date.
     * @param date - The original date
     * @param days - Number of days to add
     * @returns New Date object
     */
    static addDaysToDate(date: Date, days: number): Date {
      return addDays(date, days);
    }
  
    /**
     * Subtracts a number of days from a date.
     * @param date - The original date
     * @param days - Number of days to subtract
     * @returns New Date object
     */
    static subtractDaysFromDate(date: Date, days: number): Date {
      return subDays(date, days);
    }
  
    /**
     * Checks if the first date is before the second date.
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if date1 is before date2
     */
    static isDateBefore(date1: Date, date2: Date): boolean {
      return isBefore(date1, date2);
    }
  
    /**
     * Checks if the first date is after the second date.
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if date1 is after date2
     */
    static isDateAfter(date1: Date, date2: Date): boolean {
      return isAfter(date1, date2);
    }
  
    /**
     * Checks if two dates are exactly the same (ignores timezones).
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if the dates are equal
     */
    static isSameDate(date1: Date, date2: Date): boolean {
      return isEqual(date1, date2);
    }
  
    /**
     * Checks if the given date is today's date.
     * @param date - The date to check
     * @returns True if the date is today
     */
    static isDateToday(date: Date): boolean {
      return isToday(date);
    }
  
    /**
     * Checks if a date falls on a weekend.
     * @param date - The date to check
     * @returns True if the date is Saturday or Sunday
     */
    static isWeekendDay(date: Date): boolean {
      return isWeekend(date);
    }
  
    /**
     * Gets the start of the week for the given date.
     * @param date - The reference date
     * @returns Date object for the start of the week
     */
    static getStartOfWeek(date: Date): Date {
      return startOfWeek(date);
    }
  
    /**
     * Gets the end of the week for the given date.
     * @param date - The reference date
     * @returns Date object for the end of the week
     */
    static getEndOfWeek(date: Date): Date {
      return endOfWeek(date);
    }
  
    /**
     * Gets the first day of the month for the given date.
     * @param date - The reference date
     * @returns Date object for the first day of the month
     */
    static getStartOfMonth(date: Date): Date {
      return startOfMonth(date);
    }
  
    /**
     * Gets the last day of the month for the given date.
     * @param date - The reference date
     * @returns Date object for the last day of the month
     */
    static getEndOfMonth(date: Date): Date {
      return endOfMonth(date);
    }
  
    /**
     * Returns a string representing how much time has passed since the given date.
     * @param date - The past date
     * @returns A human-readable relative time string (e.g., "3 days ago")
     */
    static timeAgo(date: Date): string {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  }
  