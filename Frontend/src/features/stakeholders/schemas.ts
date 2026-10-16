import { z } from 'zod';

/** An optional text box: trimmed, and empty becomes null. */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null);

/**
 * Stakeholder form: raw input in, the POST /stakeholders payload out. Mirrors the backend's
 * CreateStakeholderRequest; keep the two in step.
 */
export const stakeholderFormSchema = z.object({
  /** Ids of the ticked types, from GET /stakeholder-types. */
  stakeholderTypeIds: z.array(z.string()).min(1, 'Choose at least one stakeholder type'),
  stakeholderCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9._-]{1,30}$/, 'Use 1–30 letters, numbers, dots, dashes or underscores'),
  stakeholderName: z
    .string()
    .trim()
    .min(1, 'Enter the stakeholder name')
    .max(120, 'Keep the name under 120 characters'),
  phone: z
    .string()
    .trim()
    .max(30, 'Keep the phone number under 30 characters')
    .regex(/^[0-9+()\s-]*$/, 'Use digits, spaces, +, - and brackets')
    .transform((value) => value || null),
  email: z
    .string()
    .trim()
    .max(120, 'Keep the email under 120 characters')
    .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter an email like name@example.com')
    .transform((value) => value || null),
  address: optionalText(500, 'Keep the address under 500 characters'),
  taxNo: optionalText(50, 'Keep the tax number under 50 characters'),
});

export type StakeholderFormInput = z.input<typeof stakeholderFormSchema>;
export type StakeholderFormValues = z.output<typeof stakeholderFormSchema>;

/**
 * Stakeholder search filters: raw input in, the GET /stakeholders query out. Empty filters are
 * dropped from the URL, so an empty form lists every stakeholder. Mirrors StakeholderSearchRequest.
 */
export const stakeholderSearchSchema = z.object({
  stakeholderCode: z.string().trim().toUpperCase().max(30, 'Keep the code under 30 characters'),
  stakeholderName: z.string().trim().max(120, 'Keep the name under 120 characters'),
  /** A type's id; '' means any type. */
  stakeholderTypeId: z.string(),
});

export type StakeholderSearchInput = z.input<typeof stakeholderSearchSchema>;
export type StakeholderSearchValues = z.output<typeof stakeholderSearchSchema>;
