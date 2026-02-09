import { z } from "zod";

const indianPincodeRegex = /^[1-9][0-9]{5}$/;

export const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(1, "Address line 1 is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z
    .string()
    .min(1, "Pincode is required")
    .regex(/^\d+$/, "Pincode must contain only numbers")
    .length(6, "Pincode must be exactly 6 digits")
    .refine((val) => indianPincodeRegex.test(val), {
      message: "Invalid Indian pincode (must start with 1-9)",
    }),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number must contain only numbers")
    .length(10, "Phone number must be exactly 10 digits"),
});

export type AddressInput = z.infer<typeof addressSchema>;
