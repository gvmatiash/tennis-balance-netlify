import { getStore } from '@netlify/blobs';
 import type { Context } from '@netlify/functions';
 export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Метод не поддерживается' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }
  try {
    const store = getStore('tennis-balance-data');
    const metadata = await store.getMetadata('app-data');
    
    if (!metadata) {
      return new Response(
        JSON.stringify({
          exists: false,
          message: 'Данные в облаке не найдены',
          status: 'not-found'
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    const data = await store.getJSON('app-data');
    const lastSync = data?.lastSync;
    
    let timeAgo = 'неизвестно';
    let isRecent = false;
    
    if (lastSync) {
      const syncDate = new Date(lastSync);
      const now = new Date();
      const diffMs = now.getTime() - syncDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        timeAgo = `${diffHours} ч. ${diffMinutes} мин. назад`;
      } else {
        timeAgo = `${diffMinutes} мин. назад`;
      }
      
      isRecent = diffMs < (1000 * 60 * 60);
    }
    return new Response(
      JSON.stringify({
        exists: true,
        lastSync: lastSync,
        timeAgo: timeAgo,
        isRecent: isRecent,
status: isRecent ? 'fresh' : 'stale',
 message: `Данные синхронизированы ${timeAgo}`,
 participantsCount: data?.participants?.length || 0,
 historyCount: data?.history?.length || 0,
 subscriptionBudget: data?.subscriptionBudget || 0
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
 console.error('Ошибка при проверке статуса:', error);
 return new Response(
 JSON.stringify({ 
error: 'Ошибка сервера при проверке статуса',
 details: error.message,
 status: 'error'
 }),
 { status: 500, headers: { 'Content-Type': 'application/json' } }
 );
 }
 };
 export const config = {
 path: "/api/data-status"
 };
