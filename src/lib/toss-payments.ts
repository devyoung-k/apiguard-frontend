type PaymentMethod = '카드';

interface TossRequestPaymentParams {
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  failUrl: string;
}

interface TossPaymentsInstance {
  requestPayment(
    method: PaymentMethod,
    params: TossRequestPaymentParams,
  ): Promise<unknown>;
}

type TossPaymentsFactory = (clientKey: string) => TossPaymentsInstance;

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

let tossScriptPromise: Promise<void> | null = null;

function loadTossScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('TossPayments can only be used in browser'));
  }

  if (window.TossPayments) {
    return Promise.resolve();
  }

  if (tossScriptPromise) {
    return tossScriptPromise;
  }

  tossScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-toss-payments-sdk="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load TossPayments SDK')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    script.dataset.tossPaymentsSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TossPayments SDK'));
    document.head.appendChild(script);
  });

  return tossScriptPromise;
}

export interface OpenTossCheckoutInput {
  clientKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  failUrl: string;
}

export async function openTossCheckout(
  input: OpenTossCheckoutInput,
): Promise<void> {
  await loadTossScript();

  const tossFactory = window.TossPayments;
  if (!tossFactory) {
    throw new Error('TossPayments SDK is not available');
  }

  const tossPayments = tossFactory(input.clientKey);
  await tossPayments.requestPayment('카드', {
    amount: input.amount,
    orderId: input.orderId,
    orderName: input.orderName,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    successUrl: input.successUrl,
    failUrl: input.failUrl,
  });
}
