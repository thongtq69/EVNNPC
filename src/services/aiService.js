import axios from 'axios';

// Use backend proxy to avoid CORS issues
const API_BASE = 'http://localhost:3000/api';

export const AIService = {
    async searchLegal(query, model = "kimi-k2.5-free") {
        try {
            // Try backend proxy first (avoids CORS)
            const response = await axios.post(`${API_BASE}/ai/search`, {
                query,
                model
            });
            return response.data.content;
        } catch (proxyError) {
            console.warn('Backend proxy failed, trying direct:', proxyError.message);

            // Fallback to direct API (may fail due to CORS)
            try {
                const directResponse = await axios.post('https://opencode.ai/zen/v1/chat/completions', {
                    model,
                    messages: [
                        {
                            role: "system",
                            content: `Bạn là trợ lý pháp lý chuyên nghiệp về lĩnh vực Điện lực tại Việt Nam. 
                            Bạn có kiến thức về các văn bản sau:
                            1. Luật Điện lực 2024 (61/2024/QH15) - Hiệu lực từ 01/02/2025.
                            2. Thông tư 60/2025/TT-BCT - Quy định về giá bán điện 2025.
                            3. Quyết định 1279/QĐ-BCT - Biểu giá bán lẻ điện 2025.
                            
                            Hãy trả lời ngắn gọn, chính xác và trích dẫn văn bản phù hợp.`
                        },
                        { role: "user", content: query }
                    ],
                    temperature: 0.7
                }, {
                    headers: {
                        'Authorization': 'Bearer sk-mM80RgGgqWImVzTD1bozFFxQdUN5w6BCKyaVTiagmxr1ser19R8zRIwPdyT70e34',
                        'Content-Type': 'application/json'
                    }
                });

                return directResponse.data.choices[0].message.content;
            } catch (directError) {
                throw proxyError; // Return original error
            }
        }
    }
};
