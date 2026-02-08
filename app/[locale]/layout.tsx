import { Montserrat, IBM_Plex_Sans_Arabic } from "next/font/google";
import "../globals.css";
import AuthWrapper from "@/components/authwrapper";
import { Toaster } from "sonner";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';

const montserrat = Montserrat({
  variable: "--font-app",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-app",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Common'});
 
  return {
    title: t('title')
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const fontVariable = locale === 'ar' ? ibmPlexSansArabic.variable : montserrat.variable;

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        className={`${fontVariable} font-sans antialiased overflow-x-hidden`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthWrapper>
            {children}
            <Toaster position="bottom-right" expand={false} richColors />
          </AuthWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
