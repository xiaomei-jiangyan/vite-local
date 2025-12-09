<template>
  <div class="login-wrapper">
    <AForm class="login-form" ref="formRef" @error="handleError">
      <AField
        name="userName"
        requires
        label="用户名"
        :rules="[
          {
            type: 'string',
            pattern: /\w+/,
          },
        ]"
      />
      <AField
        name="password"
        requires
        label="密码"
        :rules="[
          {
            type: 'string',
            pattern: /\w+/,
          },
        ]"
      />
      <AField name="gender" requires label="性别">
        <template #default="props">
          <ARadio
            v-bind="props"
            :Options="[
              {
                label: '男',
                value: 'male',
              },
              {
                label: '女',
                value: 'female',
              },
            ]"
          />
        </template>
      </AField>
      <div class="submit" @click="handleSubmit">登录</div>
    </AForm>
  </div>
</template>
<script setup>
import { onMounted, onUnmounted, inject, ref } from "vue";
import { useUserStore } from "@/store/user";
import { useRouter, useRoute } from "vue-router";
import { useFetch } from "@/hooks/useFetch";
import { AForm, AField, ARadio } from "@/components/Form";

const Toast = inject("toast");

const formRef = ref();

const store = useUserStore();
// const userName = ref("");
// const password = ref("");

const router = useRouter();
const route = useRoute();

const [fetchUser, { loading, error }] = useFetch("/api/login", {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
});

async function handleSubmit() {
  const values = await formRef.value.getFieldsValue();
  console.log("values", values);
  if (!values) return;
  const res = await fetchUser(values);
  if (error.value) {
    Toast.error("用户不存在");
  } else {
    const redirect = route.query.redirect || "/";
    router.replace(decodeURIComponent(redirect));
    store.login(
      {
        userName: res.name,
        userId: res.id,
      },
      res.token
    );
    Toast.success("恭喜您，登陆成功");
  }
}

async function handleError(error) {
  console.log("error", error);
  Toast.error("校验失败，请重新输入");
}
</script>

<style scoped>
.login-form {
  display: flex;
  align-items: center;
  flex-direction: column;
}
.login-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /** 渐变 */
  height: 100vh;
  background: var(--login-bg);
  background-size: 400% 400%;

  animation: gradientBG 15s ease infinite;
  overflow: hidden;
}
@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.submit {
  padding: 10px 15px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  color: #333;
  width: 60%;
  display: flex;
  margin-top: 10px;
  background: var(--submit-bg);
  align-items: center;
  justify-content: center;
}
</style>
