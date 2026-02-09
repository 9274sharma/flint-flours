"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { Header } from "@/components/landing/Header";
import { createClient } from "@/lib/supabase/client";
import { getFinalPrice } from "@/lib/utils/price";
import { extractApiError } from "@/lib/utils/extract-api-error";

type Address = {
  id: string;
  label?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): RazorpayInstance;
    };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void | Promise<void>;
  prefill?: {
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, isLoading: cartLoading, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // New address form state
  const [newAddress, setNewAddress] = useState({
    label: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  // Edit address form state
  const [editAddress, setEditAddress] = useState({
    label: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  // Filter out-of-stock items
  const inStockItems = items.filter((item) => (item.stock ?? 0) > 0 && item.isActive);

  // Calculate totals (GST is already included in prices)
  const subtotal = inStockItems.reduce((sum, item) => {
    const finalPrice = getFinalPrice(item.price, item.discountPercent);
    return sum + finalPrice * item.quantity;
  }, 0);

  const total = subtotal; // GST is included in the prices

  // Load addresses and user email
  useEffect(() => {
    async function loadData() {
      try {
        // Load user email
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }

        // Load addresses
        const response = await fetch("/api/addresses");
        if (response.ok) {
          const data = await response.json();
          setAddresses(data.addresses || []);
          if (data.addresses && data.addresses.length > 0) {
            setSelectedAddressId(data.addresses[0].id);
          }
        }
      } catch {
        setError("Failed to load addresses");
      } finally {
        setIsLoading(false);
      }
    }

    if (!cartLoading) {
      loadData();
    }
  }, [cartLoading]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && inStockItems.length === 0) {
      router.push("/cart");
    }
  }, [cartLoading, inStockItems.length, router]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses([data.address, ...addresses]);
        setSelectedAddressId(data.address.id);
        setShowNewAddressForm(false);
        setNewAddress({
          label: "",
          line1: "",
          city: "",
          state: "",
          pincode: "",
          phone: "",
        });
      } else {
        const errorData = await response.json();
        setError(extractApiError(errorData) || "Failed to create address");
      }
    } catch {
      setError("Failed to create address");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartEdit = (address: Address) => {
    setEditingAddressId(address.id);
    setEditAddress({
      label: address.label || "",
      line1: address.line1,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
    });
    setShowNewAddressForm(false);
    setError(null);
  };

  const handleCancelNewAddress = () => {
    setShowNewAddressForm(false);
    setNewAddress({
      label: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
    });
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditAddress({
      label: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
    });
    setError(null);
  };

  const handleUpdateAddress = async (e: React.FormEvent, addressId: string) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: addressId,
          ...editAddress,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(
          addresses.map((addr) =>
            addr.id === addressId ? data.address : addr,
          ),
        );
        setEditingAddressId(null);
        setEditAddress({
          label: "",
          line1: "",
          city: "",
          state: "",
          pincode: "",
          phone: "",
        });
      } else {
        const errorData = await response.json();
        setError(extractApiError(errorData) || "Failed to update address");
      }
    } catch {
      setError("Failed to update address");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceDemoOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a delivery address");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create demo order (bypasses payment)
      const orderResponse = await fetch("/api/orders/create-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          items: inStockItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: getFinalPrice(item.price, item.discountPercent),
          })),
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(extractApiError(errorData) || "Failed to create demo order");
      }

      const { order } = await orderResponse.json();

      if (!order || !order.id) {
        throw new Error("Invalid order response");
      }

      // Clear cart in background (don't await - happens in background)
      clearCart();

      // Use window.location for reliable redirect
      window.location.href = `/orders/${order.id}/success`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to place demo order";
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a delivery address");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create order
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          items: inStockItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: getFinalPrice(item.price, item.discountPercent),
          })),
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(extractApiError(errorData) || "Failed to create order");
      }

      const { order } = await orderResponse.json();

      // Create Razorpay order
      const razorpayResponse = await fetch("/api/orders/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: total,
        }),
      });

      if (!razorpayResponse.ok) {
        const errorData = await razorpayResponse.json();
        throw new Error(extractApiError(errorData) || "Failed to initialize payment");
      }

      const razorpayData = await razorpayResponse.json();

      // Initialize Razorpay checkout
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const options = {
        key: razorpayData.key,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: "Flint & Flours",
        description: `Order #${order.id.slice(0, 8)}`,
        order_id: razorpayData.orderId,
        handler: async function (response: RazorpayResponse) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/orders/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
              }),
            });

            if (verifyResponse.ok) {
              // Clear cart in background (don't await - happens in background)
              clearCart();

              // Use window.location for reliable redirect (works even if Razorpay modal is open)
              window.location.href = `/orders/${order.id}/success`;
            } else {
              const errorData = await verifyResponse.json();
              setError(extractApiError(errorData) || "Payment verification failed");
              setIsProcessing(false);
            }
          } catch {
            setError("An error occurred during payment verification");
            setIsProcessing(false);
          }
        },
        prefill: {
          email: userEmail,
          contact:
            addresses.find((a) => a.id === selectedAddressId)?.phone || "",
        },
        theme: {
          color: "#1c1917",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function () {
        setError("Payment failed. Please try again.");
        setIsProcessing(false);
      });

      razorpay.on("payment.authorized", function () {
        // Fires when payment is authorized but before handler
      });

      razorpay.open();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to place order";
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (cartLoading || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    );
  }

  if (inStockItems.length === 0) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-stone-900">Checkout</h1>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-stone-900">
                Order Summary
              </h2>

              <div className="space-y-4">
                {inStockItems.map((item) => {
                  const finalPrice = getFinalPrice(
                    item.price,
                    item.discountPercent,
                  );
                  return (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      className="flex gap-4 border-b border-stone-200 pb-4"
                    >
                      {item.imageUrl && (
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-stone-900">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-stone-600">
                          {item.variantName}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">
                          ₹
                          {(finalPrice * item.quantity).toLocaleString(
                            "en-IN",
                            { maximumFractionDigits: 2 },
                          )}
                        </p>
                        {item.discountPercent > 0 && (
                          <p className="text-xs text-stone-500 line-through">
                            ₹
                            {(item.price * item.quantity).toLocaleString(
                              "en-IN",
                              { maximumFractionDigits: 2 },
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address Section */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-stone-900">
                  Delivery Address
                </h2>
                {!editingAddressId && (
                  <button
                    onClick={() => {
                      setShowNewAddressForm(!showNewAddressForm);
                      setError(null);
                    }}
                    className="text-sm text-stone-600 hover:text-stone-900"
                  >
                    {showNewAddressForm ? "Cancel" : "+ Add New Address"}
                  </button>
                )}
              </div>

              {showNewAddressForm ? (
                <form onSubmit={handleCreateAddress} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Label (Home, Office, etc.)
                    </label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, label: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                      placeholder="Home"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Address Line 1 *
                    </label>
                    <input
                      placeholder="123, Main Street, Mumbai"
                      type="text"
                      required
                      value={newAddress.line1}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, line1: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        City *
                      </label>
                      <input
                        placeholder="Mumbai"
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        State *
                      </label>
                      <input
                        placeholder="Maharashtra"
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            state: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        Pincode * (6 digits)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddress.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only numbers
                          if (value.length <= 6) {
                            setNewAddress({ ...newAddress, pincode: value });
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                        placeholder="123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        Phone * (10 digits)
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newAddress.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only numbers
                          if (value.length <= 10) {
                            setNewAddress({ ...newAddress, phone: value });
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 rounded-lg bg-stone-850 px-4 py-2 text-white disabled:opacity-50"
                    >
                      {isProcessing ? "Saving..." : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelNewAddress}
                      disabled={isProcessing}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-stone-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : editingAddressId ? (
                // Edit address form
                <form
                  onSubmit={(e) => handleUpdateAddress(e, editingAddressId)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Label (Home, Office, etc.)
                    </label>
                    <input
                      type="text"
                      value={editAddress.label}
                      onChange={(e) =>
                        setEditAddress({
                          ...editAddress,
                          label: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                      placeholder="Home"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Address Line 1 *
                    </label>
                    <input
                      placeholder="123, Main Street, Mumbai"
                      type="text"
                      required
                      value={editAddress.line1}
                      onChange={(e) =>
                        setEditAddress({
                          ...editAddress,
                          line1: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        City *
                      </label>
                      <input
                        placeholder="Mumbai"
                        type="text"
                        required
                        value={editAddress.city}
                        onChange={(e) =>
                          setEditAddress({
                            ...editAddress,
                            city: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        State *
                      </label>
                      <input
                        placeholder="Maharashtra"
                        type="text"
                        required
                        value={editAddress.state}
                        onChange={(e) =>
                          setEditAddress({
                            ...editAddress,
                            state: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        Pincode * (6 digits)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={editAddress.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only numbers
                          if (value.length <= 6) {
                            setEditAddress({ ...editAddress, pincode: value });
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                        placeholder="123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        Phone * (10 digits)
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={editAddress.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Only numbers
                          if (value.length <= 10) {
                            setEditAddress({ ...editAddress, phone: value });
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400"
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 rounded-lg bg-stone-850 px-4 py-2 text-white disabled:opacity-50"
                    >
                      {isProcessing ? "Updating..." : "Update Address"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isProcessing}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-stone-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <p className="text-stone-600">
                      No addresses saved. Please add an address to continue.
                    </p>
                  ) : (
                    addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`rounded-lg border-2 p-4 ${
                          selectedAddressId === address.id
                            ? "border-stone-850 bg-stone-50"
                            : "border-stone-200"
                        }`}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={(e) =>
                              setSelectedAddressId(e.target.value)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            {address.label && (
                              <span className="font-medium text-stone-900">
                                {address.label} -{" "}
                              </span>
                            )}
                            <span className="text-stone-700">
                              {address.line1}, {address.city}, {address.state}{" "}
                              {address.pincode}
                            </span>
                            <p className="mt-1 text-sm text-stone-600">
                              Phone: {address.phone}
                            </p>
                          </div>
                        </label>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(address)}
                            className="text-sm text-stone-600 hover:text-stone-900"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Total */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-stone-900">
                Order Total
              </h2>

              <div className="space-y-2 border-b border-stone-200 pb-4">
                <div className="flex justify-between text-stone-700">
                  <span>
                    Sub Total{" "}
                    <span className="text-xs text-stone-500">
                      (%GST included)
                    </span>
                  </span>
                  <span>
                    ₹
                    {subtotal.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-between text-lg font-semibold text-stone-900">
                <span>Total</span>
                <span>
                  ₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !selectedAddressId}
                  className="w-full rounded-lg bg-stone-850 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Place Order"}
                </button>
                <button
                  onClick={handlePlaceDemoOrder}
                  disabled={isProcessing || !selectedAddressId}
                  className="w-full rounded-lg border-2 border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Place Demo Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
