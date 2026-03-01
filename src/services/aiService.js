import api from './api';

export const AIService = {
    async searchLegal(query, model = "kimi-k2.5-free") {
        const candidates = [model, 'kimi-k2.5-free', 'glm-4.7-free'];
        const tried = new Set();

        for (const candidate of candidates) {
            if (!candidate || tried.has(candidate)) {
                continue;
            }
            tried.add(candidate);

            try {
                const { data } = await api.post('/ai/search', { query, model: candidate });
                if (data?.content) {
                    return data.content;
                }
            } catch {
                // Try next model
            }
        }

        return 'Chưa thể kết nối máy chủ tra cứu AI ở thời điểm này. Bạn có thể đổi model hoặc thử lại sau ít phút.';
    }
};
