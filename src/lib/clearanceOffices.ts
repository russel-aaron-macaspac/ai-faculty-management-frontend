export const FACULTY_REQUIRED_OFFICES = [
  'Dominican Learning Resource Center',
  'Property management office',
  'Laboratory',
  'ICT',
  'CISO',
  'Program Chair',
  'Dean',
  'Registrar',
  'OVPREL',
  'OVPAA',
  'Accounting',
  'Treasury',
  'HRO',
];

export const toOfficeSlug = (office: string) =>
  office
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('-');

export const fromOfficeSlug = (slug: string) =>
  FACULTY_REQUIRED_OFFICES.find((office) => toOfficeSlug(office) === slug);