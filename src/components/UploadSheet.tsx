import React from "react";

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export default function UploadSheet({
  isOpen,
  onClose,
  onUpload,
}: UploadSheetProps) {
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
    if (files.length > 0) {
      onUpload(files);
    }
    e.target.value = "";
  };

  return (
    <>
      {/* Semi-transparent Dark Background Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/70 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col bg-background-light dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-primary/10">
          {/* BottomSheetHandle */}
          <div className="flex h-6 w-full items-center justify-center">
            <div className="h-1.5 w-12 rounded-full bg-primary/20 dark:bg-primary/40"></div>
          </div>

          <div className="flex flex-col items-stretch">
            <h4 className="text-primary text-sm font-bold leading-normal tracking-wider px-4 py-4 text-center uppercase">
              Tải giao dịch
            </h4>

            <div className="px-4 pb-8 space-y-3">
              {/* Option: Camera */}
              <label className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 min-h-[72px] rounded-2xl border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform w-full text-left cursor-pointer">
                <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-12">
                  <span className="material-symbols-outlined">
                    photo_camera
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 dark:text-slate-100 text-base font-semibold leading-tight">
                    Chụp ảnh hóa đơn
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Sử dụng camera để quét thông tin
                  </p>
                </div>
                <div className="shrink-0 text-slate-400">
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Option: Gallery */}
              <label className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 min-h-[72px] rounded-2xl border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-transform w-full text-left cursor-pointer">
                <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-12">
                  <span className="material-symbols-outlined">image</span>
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 dark:text-slate-100 text-base font-semibold leading-tight">
                    Chọn từ thư viện
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Tải lên ảnh có sẵn từ thiết bị
                  </p>
                </div>
                <div className="shrink-0 text-slate-400">
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg, image/webp, image/heic"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Cancel Button */}
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full h-14 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 text-base font-bold active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Safe Area */}
        <div className="h-8 bg-background-light dark:bg-slate-900"></div>
      </div>
    </>
  );
}
