// Bottom Tabs (inside MainTabs)
export type RootTabParamList = {
  Dashboard: undefined;
  MealPlan: undefined;
  Workout: undefined;
};

// Drawer (inside AppDrawer)
export type RootDrawerParamList = {
  MainTabs: {
    screen?: keyof RootTabParamList;
    params?: RootTabParamList[keyof RootTabParamList];
  };
  Profile: undefined;
  Settings: undefined;
};

// Global Stack
export type RootStackParamList = {
  AppDrawer: {
    screen?: keyof RootDrawerParamList;
    params?: RootDrawerParamList[keyof RootDrawerParamList];
  };
  CheckIn: undefined;
  WeighIn: undefined;
};
