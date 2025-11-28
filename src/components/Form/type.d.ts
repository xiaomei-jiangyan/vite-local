export type IRule = {
  message?: string;
  type?: string;
  pattern?: RegExp;
  required?: boolean;
  validator?: Function;
};

export type IField = {
  required?: boolean;
  name: string;
  rules?: IRule[];
};
