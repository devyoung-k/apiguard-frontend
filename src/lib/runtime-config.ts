const USE_MOCK_VALUE = process.env.NEXT_PUBLIC_USE_MOCK ?? 'false';

export const USE_MOCK_API = USE_MOCK_VALUE.toLowerCase() === 'true';
