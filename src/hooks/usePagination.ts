import { ref } from "vue";
import { useFetch, Options } from "./useFetch";

export const PaginationIterator = {
  pageNum: "pageNum",
  pageSize: "pageSize",
};

export const defaultPageSize = 10;

export function usePagination(
  url: string,
  options: Options & { pageSize: number; pageNum: number } = {
    pageSize: defaultPageSize,
    pageNum: 0,
  }
) {
  const pageSize = ref(options.pageSize);
  const pageNum = ref(options.pageNum);
  const hasMore = ref(true);

  const [pageFetch, response] = useFetch(url, options);

  async function change() {
    if (!hasMore.value) return null;
    const res = await pageFetch({
      pageSize: pageSize.value,
      pageNum: pageNum.value,
    }).then((res: any) => {
      pageNum.value++;
      return res;
    });
    if (!res || res.length === 0) hasMore.value = false;
    return res;
  }

  return [change, { ...response, hasMore }];
}
