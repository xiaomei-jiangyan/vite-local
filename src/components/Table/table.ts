let storage = new Map();
export function useTableStore(key?: string) {
  function save(value: any, _key = key) {
    if (!_key) return;
    storage.set(_key, value);
  }
  function get(_key = key) {
    if (!_key) return;
    const res = storage.get(_key);
    storage.delete(_key);
    return res;
  }
  function clear() {
    storage.clear();
  }
  return { save, get, clear };
}

export const exportCSV = (columns: any[], data: any[]) => {
  const headers = columns.map((col) => col.title); // 获取表头（列名）
  const rows = data.map((item) => columns.map((col) => item[col.dataIndex])); // 获取数据行

  const csvContent = [
    headers.join(","), // 表头
    ...rows.map((row) => row.join(",")), // 数据行
  ].join("\n");

  // 创建 Blob 对象，类型为 CSV 格式
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // 设置下载文件名
  link.setAttribute("href", url);
  link.setAttribute("download", "data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
