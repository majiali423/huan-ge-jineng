export type SkillId =
  | "photography"
  | "guitar"
  | "python"
  | "excel"
  | "english"
  | "presentation";

export type Profile = {
  id: string;
  nickname: string;
  bio: string;
  teachSkillId: SkillId;
  learnSkillId: SkillId;
  teachDescription: string;
  learnGoal: string;
};

export type Invitation = {
  id: string;
  targetUserId: string;
  targetNickname: string;
  myTeachSkillId: SkillId;
  partnerTeachSkillId: SkillId;
  myTeachDescription: string;
  partnerTeachDescription: string;
  message: string;
  status: "pending" | "withdrawn";
  createdAt: string;
};

export type FilterId = "all" | "match" | "favorites";
