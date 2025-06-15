import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
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
          exists: false,
          message: 'Данные в облаке не найдены',
          status: 'not-found'
        }),
        { status: 200, headers: corsHeaders }
      );
    }

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
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Ошибка при проверке статуса:', error);
    return new Response(
      JSON.stringify({
        error: 'Ошибка сервера при проверке статуса',
        details: error.message,
        status: 'error'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};