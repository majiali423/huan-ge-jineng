import type { Profile, SkillId } from "./types";

export const SKILLS: { id: SkillId; name: string }[] = [
  { id: "photography", name: "摄影" },
  { id: "guitar", name: "吉他" },
  { id: "python", name: "Python" },
  { id: "excel", name: "Excel" },
  { id: "english", name: "英语口语" },
  { id: "presentation", name: "演讲表达" },
];

export const skillName = (id: SkillId) =>
  SKILLS.find((s) => s.id === id)?.name ?? id;

export const AVATAR_COLORS = [
  "#159C78",
  "#1D6A9A",
  "#C45C26",
  "#6B4EA1",
  "#B45309",
  "#0F766E",
];

export const MEMBERS: Profile[] = [
  {
    id: "suqing",
    nickname: "苏晴",
    bio: "弹吉他 3 年，愿意陪你从第一首歌开始。",
    teachSkillId: "guitar",
    learnSkillId: "photography",
    teachDescription: "从握琴、基础和弦到简单弹唱，陪你完整练完第一首歌。",
    learnGoal: "想学会用手机拍出更自然的人像，理解构图和光线。",
  },
  {
    id: "linzhou",
    nickname: "林舟",
    bio: "喜欢民谣，可以教你基础和弦与节奏。",
    teachSkillId: "guitar",
    learnSkillId: "photography",
    teachDescription: "用民谣节奏带你熟悉和弦转换，练出稳定的伴奏手感。",
    learnGoal: "希望拍出有故事感的生活照片，学会基础后期调整。",
  },
  {
    id: "chenmo",
    nickname: "陈默",
    bio: "从零讲解 Python，带你写一个小工具。",
    teachSkillId: "python",
    learnSkillId: "photography",
    teachDescription: "从变量和循环讲起，带你写一个能真正用起来的小脚本。",
    learnGoal: "想学会记录日常的摄影方法，拍出更清晰的生活瞬间。",
  },
  {
    id: "xuzhi",
    nickname: "许知",
    bio: "分享实用表格技巧，让日常工作更轻松。",
    teachSkillId: "excel",
    learnSkillId: "python",
    teachDescription: "分享筛选、透视表和常用函数，帮你把重复工作变快。",
    learnGoal: "想用 Python 处理表格数据，减少手工复制粘贴。",
  },
  {
    id: "zhouran",
    nickname: "周然",
    bio: "喜欢用手机记录生活，想学习简单弹唱。",
    teachSkillId: "photography",
    learnSkillId: "guitar",
    teachDescription: "教你用手机抓住光线和构图，把日常拍得更有温度。",
    learnGoal: "希望学会基础和弦，并尝试弹唱一首简单的歌曲。",
  },
  {
    id: "heyue",
    nickname: "何悦",
    bio: "陪你练日常英语，也想提升公开表达能力。",
    teachSkillId: "english",
    learnSkillId: "presentation",
    teachDescription: "用生活场景陪练口语，帮你把常用表达说得更自然。",
    learnGoal: "想把想法讲得更清楚，练习上台时的节奏和结构。",
  },
];

export const DRAFT_DEFAULT = {
  nickname: "小林",
  teachSkillId: "photography" as SkillId,
  learnSkillId: "guitar" as SkillId,
  teachDescription: "教你用手机理解构图和光线，拍出更自然的人像。",
  learnGoal: "希望掌握基础和弦，并尝试弹唱一首简单的歌曲。",
};

export const DEFAULT_INVITE_MESSAGE =
  "你好，我们的技能刚好互补，想和你试一次各 30 分钟的技能交换！";
