const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// GEMINI_API_KEY 관련 부분을 임시로 삭제했습니다.

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    try {
        const body = JSON.parse(event.body);
        const { type } = body;

        if (type === 'weather') {
            const { query } = body;
            if (!query) {
                return { statusCode: 400, body: JSON.stringify({ error: "위치 정보(query)가 필요합니다." }) };
            }
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            const urlToday = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${query}&lang=ko`;
            const urlYesterday = `https://api.weatherapi.com/v1/history.json?key=${WEATHER_API_KEY}&q=${query}&dt=${yesterdayStr}&lang=ko`;

            const [todayRes, yesterdayRes] = await Promise.all([fetch(urlToday), fetch(urlYesterday)]);

            if (!todayRes.ok || !yesterdayRes.ok) {
                console.error('Weather API Error:', await todayRes.text(), await yesterdayRes.text());
                return { statusCode: 502, body: JSON.stringify({ error: "날씨 API 서버에서 응답을 받지 못했습니다. API 키가 유효한지 확인해주세요." }) };
            }
            const todayData = await todayRes.json();
            const yesterdayData = await yesterdayRes.json();
            if (todayData.error || yesterdayData.error) {
                 return { statusCode: 400, body: JSON.stringify({ error: todayData.error?.message || yesterdayData.error?.message || "날씨 정보를 가져올 수 없는 지역입니다." }) };
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ today: todayData, yesterday: yesterdayData }),
            };
        } else {
            // Gemini 관련 요청은 임시로 에러 처리합니다.
            return { statusCode: 400, body: JSON.stringify({ error: 'Gemini 기능은 임시로 비활성화되었습니다.' }) };
        }
    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '서버 내부 오류가 발생했습니다: ' + error.message }),
        };
    }
};
