import {redirect} from '@/i18n/navigation';

interface HomeProps {
  params: Promise<{locale: string}>;
}

export default async function Home({params}: HomeProps) {
  const {locale} = await params;
  redirect({href: '/login', locale});
}
