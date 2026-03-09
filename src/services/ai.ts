import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeReceipt(
  base64Image: string,
  mimeType: string,
  retries = 3
): Promise<Partial<Transaction>> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: "Phân tích ảnh hóa đơn/biên lai chuyển khoản này. Trích xuất các thông tin sau: số tiền (amount) dạng số nguyên (không có dấu phẩy hay chữ). LƯU Ý QUAN TRỌNG: Nếu hóa đơn là tiền Yên Nhật (JPY), hãy tự động chuyển đổi sang Việt Nam Đồng (VND) theo tỉ giá hiện tại (khoảng 1 JPY = 165 VND) và chỉ trả về số tiền VND đã chuyển đổi. Nội dung chuyển khoản/mua hàng (content), ngày giờ giao dịch (date) định dạng ISO 8601 (ví dụ: 2023-10-24T10:30:00Z), và phân loại danh mục (category) vào 1 trong các loại sau: 'Mua sắm', 'Ăn uống', 'Gia đình', 'Di chuyển', 'Quà tặng', 'Y tế', 'Học tập', 'Khác'. Những item không phân biệt được category sẽ chuyển sang 'Khác'. Nếu không rõ ngày giờ, hãy dùng thời gian hiện tại. NẾU KHÔNG TÌM THẤY THÔNG TIN HOẶC ẢNH KHÔNG PHẢI HÓA ĐƠN: Hãy trả về amount là 0, content là 'Không rõ nội dung', date là thời gian hiện tại, và category là 'Khác'. Đừng báo lỗi.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: {
                type: Type.INTEGER,
                description: "Số tiền giao dịch (đã chuyển sang VND nếu là ngoại tệ), ví dụ 150000",
              },
              content: {
                type: Type.STRING,
                description: "Nội dung giao dịch hoặc tên cửa hàng",
              },
              date: {
                type: Type.STRING,
                description: "Ngày giờ giao dịch định dạng ISO 8601",
              },
              category: {
                type: Type.STRING,
                description:
                  "Phân loại: 'Mua sắm', 'Ăn uống', 'Gia đình', 'Di chuyển', 'Quà tặng', 'Y tế', 'Học tập', 'Khác'",
              },
            },
            required: ["amount", "content", "date", "category"],
          },
        },
      });

      const jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);
      return {
        amount: data.amount,
        content: data.content,
        date: data.date,
        category: data.category as Category,
      };
    } catch (e: any) {
      if (e?.status === 429 || e?.message?.includes("429") || e?.message?.includes("Quota exceeded")) {
        throw new Error("Bạn đã sử dụng hết lượt phân tích hóa đơn miễn phí trong ngày hôm nay. Vui lòng thử lại vào ngày mai hoặc nâng cấp tài khoản API.");
      }
      if (e?.status === 503 || e?.message?.includes("503")) {
        if (attempt < retries - 1) {
          console.warn(`AI model overloaded (503). Retrying in ${Math.pow(2, attempt)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        } else {
          throw new Error("Hệ thống AI đang quá tải (503). Vui lòng thử lại sau ít phút.");
        }
      }
      console.error("Failed to parse AI response", e);
      throw new Error("Không thể phân tích hóa đơn: " + (e.message || "Lỗi không xác định"));
    }
  }
  throw new Error("Hệ thống AI đang quá tải. Vui lòng thử lại sau.");
}
