import AdminProviders from "./providers";

export const metadata = {
  title: "Studio XXVII — Admin",
};

export default function AdminLayout({ children }) {
  return <AdminProviders>{children}</AdminProviders>;
}
