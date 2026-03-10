export type Category =
  | "Ăn uống"
  | "Học tập"
  | "Di chuyển"
  | "Sinh hoạt"
  | "Y tế"
  | "Quà tặng"
  | "Thời trang"
  | "Phí phát sinh"
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
  imageHash?: string;
  type?: "income" | "expense";
  isDeleted?: boolean;
}
