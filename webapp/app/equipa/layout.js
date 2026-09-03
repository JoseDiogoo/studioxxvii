import AdminProviders from "./providers";

export const metadata = {
  title: "Área da Equipa",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminProviders>{children}</AdminProviders>;
}
