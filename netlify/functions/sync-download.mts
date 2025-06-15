import { getStore } from '@netlify/blobs';

export default async (req: Request) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Метод не поддерживается' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const store = getStore('tennis-balance-data');
    const data = await store.getJSON('app-data');

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Данные не найдены',
          exists: false
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        lastSync: data.lastSync || new Date().toISOString(),
        message: 'Данные успешно загружены'
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    return new Response(
      JSON.stringify({
        error: 'Ошибка сервера при загрузке данных',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};