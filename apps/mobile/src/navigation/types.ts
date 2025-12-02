import { Category } from "../../../../types";

export type RootStackParamList = {
  Home: undefined;
  Results: { category: Category };
};

export type ScreenCategory = Category;


