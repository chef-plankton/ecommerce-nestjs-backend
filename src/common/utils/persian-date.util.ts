import jalaliMoment from 'jalali-moment';

export function toPersianDate(date: Date | string, format = 'jYYYY/jMM/jDD'): string {
  return jalaliMoment(date).locale('fa').format(format);
}

export function toPersianDateTime(date: Date | string): string {
  return jalaliMoment(date).locale('fa').format('jYYYY/jMM/jDD HH:mm:ss');
}

export function fromPersianDate(persianDate: string, format = 'jYYYY/jMM/jDD'): Date {
  return jalaliMoment(persianDate, format).toDate();
}

export function getPersianMonthName(month: number): string {
  const months = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];
  return months[month - 1] || '';
}

export function getPersianDayName(dayOfWeek: number): string {
  const days = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه',
  ];
  return days[dayOfWeek] || '';
}
