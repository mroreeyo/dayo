export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  EventDetail: { eventId: string; calendarId: string };
  MemberList: { calendarId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
