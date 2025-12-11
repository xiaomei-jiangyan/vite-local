import { CheckboxProps, InputProps, RadioProps, SwitchProps } from "ant-design-vue";

import component from "../../../shims-vue";
import { selectProps } from "ant-design-vue/es/vc-select";
import { TableProps, ColumnProps } from "ant-design-vue/es/table";

export type ISearch = {
  component: component;
  label: string;
  name: string;
  props: InputProps | SelectProps | CheckboxProps | RadioProps | SwitchProps;
  valueKey?: string;
  model?: any;
  debounce?: number;
  validator?: RegExp | Function;
  invisible?: boolean | Function;
  dependenices?: string[]; // name 字段的集合
};

export interface IColumn extends ColumnProps {
  search?: ISearch;
  csvKey?: string;
  invisible?: boolean;
}

export interface ITable extends TableProps {
  pageSize?: number;
  auto?: boolean; // 是否打开页面后自动请求
  showPagination?: boolean;
  pageSizeIternal?: string;
  pageNumIternal?: string;
  pageSize?: number;
  columns: IColumn[];
  action: string;
  cache?: boolean;
  method: "GET" | "POST";
  renderAdditional?: boolean;
  clientPagination?: number | false; // 是否支持客户端分页
  beforeRequest?: (...args) => Promise;
  afterRequest?: (...args) => Promise;
  customRequest?: (...args) => Promise;
  storageQuery?: string; // 是否缓存当前查询参数
}
