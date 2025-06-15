import { getStore } from '@netlify/blobs';

export default async (req: Request) => {
  // CORS headers для всех ответов
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Обработка preflight OPTIONS запроса
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Метод не поддерживается' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const requestData = await req.json();
    
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Неверный формат данных' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const dataToSave = {
      ...requestData,
      lastSync: new Date().toISOString(),
      syncId: Date.now().toString()
    };

    const store = getStore('tennis-balance-data');
    await store.setJSON('app-data', dataToSave);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Данные успешно сохранены в облако',
        lastSync: dataToSave.lastSync,
        syncId: dataToSave.syncId
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Ошибка при сохранении данных:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Ошибка сервера при сохранении данных',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
