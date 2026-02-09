import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().uuid("Valid address ID is required"),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
