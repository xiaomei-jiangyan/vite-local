import { useUserStore } from "@/store/user";
import { ref } from "vue";
import { useRouter } from "vue-router";

export type Options = Partial<Request>;

export function useFetch(url: string, options: Options = {}) {
  const { ...others } = options;
  const loading = ref(false);
  const error = ref(null);

  const abortController = new AbortController();
  const user = useUserStore();
  const router = useRouter();
  const handleFetch = (params?: Options) => {
    return new Promise((resolve) => {
      loading.value = true;

      const p = fetch(url, {
        ...others,
        body: JSON.stringify({
          token: user.token,
          ...(others.body ?? {}),
          ...params,
        } as BodyInit),
        signal: abortController.signal,
      });

      p.then((res) => res.json())
        .then((res: any) => {
          if (res.code === 0) {
            error.value = null;
            resolve(res.data);
          } else if (res.code === 401) {
            const query = window.location.href.split("?")[1];
            const url = new URLSearchParams(query);
            const redirect = url.get("redirect");
            console.log("服务端401重定向", redirect);
            url.delete("redirect");
            router.replace({
              path: "/login",
              query: { redirect: redirect || "/" },
            });
          } else {
            error.value = res.code;
            resolve(res.data);
          }
        })
        .catch((e) => {
          error.value = e.code ?? e.message;
          resolve(e);
        })
        .finally(() => {
          loading.value = false;
        });
    });
  };

  function cancel() {
    abortController.abort();
  }

  return [
    handleFetch,
    {
      loading,
      error,
      cancel,
    },
  ] as [Function, Object];
}
