import { redirect } from '@/i18n/navigation';

interface SystemAdminIndexPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SystemAdminIndexPage({
  params,
}: SystemAdminIndexPageProps) {
  const { locale } = await params;
  redirect({ href: '/system-admin/users', locale });
}
