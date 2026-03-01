import api from './api';

export const AIService = {
    async searchLegal(query, model = "kimi-k2.5-free") {
        const candidates = [model, 'kimi-k2.5-free', 'glm-4.7-free'];
        const tried = new Set();
        let lastError = null;

        for (const candidate of candidates) {
            if (!candidate || tried.has(candidate)) {
                continue;
            }
            tried.add(candidate);

            try {
                const { data } = await api.post('/ai/search', { query, model: candidate });
                if (data?.content) {
                    return {
                        content: data.content,
                        fallback: !!data.fallback,
                        reason: data.reason || null,
                        model: candidate
                    };
                }
            } catch (error) {
                lastError = error;
                // Try next model
            }
        }

        if (lastError) {
            throw lastError;
        }

        return {
            content: 'Chưa thể kết nối máy chủ tra cứu AI ở thời điểm này. Bạn có thể đổi model hoặc thử lại sau ít phút.',
            fallback: true,
            reason: 'no_content',
            model
        };
    }
};
