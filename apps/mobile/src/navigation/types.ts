export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Month: { calendarId: string };
  EventDetail: EventDetailParams;
  CalendarManage: CalendarManageParams;
  MemberList: MemberListParams;
  Settings: undefined;
};

export type EventDetailParams = {
  id: string;
  calendarId?: string;
};

export type CalendarManageParams = {
  id: string;
};

export type MemberListParams = {
  id: string;
};
