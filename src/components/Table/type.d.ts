import { CheckboxProps, InputProps, RadioProps, SwitchProps } from "ant-design-vue";

import component from "../../../shims-vue";
import { selectProps } from "ant-design-vue/es/vc-select";
export type ISearch = {
  component: component;
  label: string;
  name: string;
  props: InputProps | SelectProps | CheckboxProps | RadioProps | SwitchProps;
  valueKey?: string;
  model?: any;
  debounce?: number;
  validator?: RegExp | Function;
};
