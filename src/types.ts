export type Category =
  | "Mua sắm"
  | "Ăn uống"
  | "Gia đình"
  | "Di chuyển"
  | "Quà tặng"
  | "Y tế"
  | "Học tập"
  | "Khác"
  | "Tiền lương"
  | "Tiền thưởng"
  | "Tiền quà tặng"
  | string;

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  content: string;
  category: Category;
  imageUrl?: string;
  type?: "income" | "expense";
}
