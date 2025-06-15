import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Метод не поддерживается' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
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
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        lastSync: data.lastSync || new Date().toISOString(),
        message: 'Данные успешно загружены'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Ошибка сервера при загрузке данных',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
};