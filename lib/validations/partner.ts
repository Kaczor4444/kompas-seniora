import { z } from "zod";

export const partnerInquirySchema = z.object({
  name: z
    .string()
    .min(2, "Imię i nazwisko musi mieć minimum 2 znaki")
    .max(100, "Imię i nazwisko jest za długie"),
  
  email: z
    .string()
    .email("Nieprawidłowy adres email")
    .toLowerCase()
    .trim(),
  
  organization: z
    .string()
    .min(2, "Nazwa organizacji musi mieć minimum 2 znaki")
    .max(200, "Nazwa organizacji jest za długa"),
  
  partnerType: z.enum(["mops", "facility", "association", "other"], {
    errorMap: () => ({ message: "Wybierz typ partnera" })
  }),
  
  phone: z
    .string()
    .optional()
    .transform(val => val?.trim() || undefined),
  
  message: z
    .string()
    .min(10, "Wiadomość musi mieć minimum 10 znaków")
    .max(2000, "Wiadomość jest za długa"),
  
  gdprConsent: z
    .boolean()
    .refine(val => val === true, {
      message: "Musisz wyrazić zgodę na przetwarzanie danych"
    })
});

export type PartnerInquiryInput = z.infer<typeof partnerInquirySchema>;
