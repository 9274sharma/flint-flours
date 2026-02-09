import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-2 text-gray-700">Manage your store.</p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/products"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Products</span>
          <p className="mt-1 text-sm text-gray-600">
            Add, edit, and manage products
          </p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Orders</span>
          <p className="mt-1 text-sm text-gray-600">
            View and update order status
          </p>
        </Link>
        <Link
          href="/admin/craft"
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">Our Craft</span>
          <p className="mt-1 text-sm text-gray-600">
            Manage homepage gallery images
          </p>
        </Link>
      </div>
    </div>
  );
}
