import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
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
    const requestData = await req.json();
    
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Неверный формат данных' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
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
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Ошибка при сохранении данных:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Ошибка сервера при сохранении данных',
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