export const formatCurrency = (value) => {
  if (!value) return "0";
  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

export const parseCurrency = (value) => {
  if (!value) return 0;
  return parseInt(value.replace(/\D/g, ""));
};

export const formatter = new Intl.NumberFormat("vi-VN", {});
