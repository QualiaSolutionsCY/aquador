import { Metadata } from 'next';
import MaintenancePage from './MaintenanceClient';

export const metadata: Metadata = {
  // Override the layout-level title.template by setting title to a string
  // (or { absolute }) so the page title reads cleanly without the suffix
  // chain.
  title: { absolute: "Opening 18 May 2026 | Aquad'or" },
  description:
    "Aquad'or is being redrawn. The Dubai shop, Lattafa originals and the create-your-own studio return on 18 May 2026.",
  robots: { index: false, follow: false },
};

export default function Maintenance() {
  return <MaintenancePage />;
}
