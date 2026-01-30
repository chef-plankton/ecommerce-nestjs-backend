import slugify from 'slugify';

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'fa',
  });
}

export function generateUniqueSlug(text: string, suffix?: string): string {
  const baseSlug = generateSlug(text);
  return suffix ? `${baseSlug}-${suffix}` : baseSlug;
}
