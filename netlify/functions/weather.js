const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
        } else if (type === 'gemini') {
            const { prompt } = body;
            if (!prompt) {
                return { statusCode: 400, body: JSON.stringify({ error: "프롬프트(prompt)가 필요합니다." }) };
            }
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
             if (!response.ok) {
                const errorBody = await response.text();
                console.error('Gemini API Error:', errorBody);
                return { statusCode: response.status, body: JSON.stringify({ error: `API 요청 실패: ${response.status} ${response.statusText}. Gemini API 키를 확인해주세요.` }) };
            }
            const result = await response.json();
             return {
                statusCode: 200,
                body: JSON.stringify(result),
            };
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: '잘못된 요청 타입입니다.' }) };
        }
    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '서버 내부 오류가 발생했습니다: ' + error.message }),
        };
    }
};
