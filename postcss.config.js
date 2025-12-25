import pxtorem from "postcss-pxtorem";

export default {
  plugins: [
    pxtorem({
      rootValue: 18.75, // 设计稿 375px → 1rem = 20px
      propList: ["*"], // 所有属性都转换
      unitPrecision: 5, // rem 精度
      selectorBlackList: [".ignore"], // 忽略类
      replace: true,
      mediaQuery: false,
      minPixelValue: 1,
    }),
  ],
};
