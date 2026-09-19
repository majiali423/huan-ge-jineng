import { useMemo, useState } from "react";
import {
  AVATAR_COLORS,
  DEFAULT_INVITE_MESSAGE,
  DRAFT_DEFAULT,
  MEMBERS,
  SKILLS,
  skillName,
} from "./data";
import {
  KEYS,
  loadFavorites,
  loadInvitations,
  loadProfile,
  saveJson,
} from "./storage";
import type { FilterId, Invitation, Profile, SkillId } from "./types";

type Page = "discover" | "exchanges";
type FormState = {
  nickname: string;
  teachSkillId: SkillId;
  learnSkillId: SkillId;
  teachDescription: string;
  learnGoal: string;
};

const emptyErrors = {
  nickname: "",
  teachSkillId: "",
  learnSkillId: "",
  teachDescription: "",
  learnGoal: "",
};

function isMatch(me: Profile | null, other: Profile) {
  if (!me) return false;
  return me.teachSkillId === other.learnSkillId && me.learnSkillId === other.teachSkillId;
}

function avatarColor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function App() {
  const [page, setPage] = useState<Page>("discover");
  const [myProfile, setMyProfile] = useState<Profile | null>(() => loadProfile());
  const [invitations, setInvitations] = useState<Invitation[]>(() => loadInvitations());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState("");

  const [publishOpen, setPublishOpen] = useState(false);
  const [detail, setDetail] = useState<Profile | null>(null);
  const [confirmInvite, setConfirmInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState(DEFAULT_INVITE_MESSAGE);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState<FormState>(DRAFT_DEFAULT);
  const [errors, setErrors] = useState(emptyErrors);

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
  };

  const persist = (key: string, value: unknown) => {
    try {
      saveJson(key, value);
      setStorageError("");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存失败";
      setStorageError(message);
      return false;
    }
  };

  const openPublish = () => {
    setForm(
      myProfile
        ? {
            nickname: myProfile.nickname,
            teachSkillId: myProfile.teachSkillId,
            learnSkillId: myProfile.learnSkillId,
            teachDescription: myProfile.teachDescription,
            learnGoal: myProfile.learnGoal,
          }
        : DRAFT_DEFAULT,
    );
    setErrors(emptyErrors);
    setPublishOpen(true);
  };

  const validate = (value: FormState) => {
    const next = { ...emptyErrors };
    const nick = value.nickname.trim();
    if (nick.length < 2 || nick.length > 12) next.nickname = "昵称需为 2–12 个字";
    if (!value.teachSkillId) next.teachSkillId = "请选择你能教的技能";
    if (!value.learnSkillId) next.learnSkillId = "请选择你想学的技能";
    if (value.teachSkillId && value.learnSkillId && value.teachSkillId === value.learnSkillId) {
      next.learnSkillId = "能教和想学不能是同一技能";
    }
    const teach = value.teachDescription.trim();
    if (teach.length < 10 || teach.length > 120) next.teachDescription = "具体内容需为 10–120 字";
    const learn = value.learnGoal.trim();
    if (learn.length < 10 || learn.length > 120) next.learnGoal = "学习目标需为 10–120 字";
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const submitProfile = () => {
    if (!validate(form)) return;
    const profile: Profile = {
      id: myProfile?.id ?? "me",
      nickname: form.nickname.trim(),
      bio: "想用自己擅长的技能，换一次认真的互相学习。",
      teachSkillId: form.teachSkillId,
      learnSkillId: form.learnSkillId,
      teachDescription: form.teachDescription.trim(),
      learnGoal: form.learnGoal.trim(),
    };
    if (!persist(KEYS.profile, profile)) return;
    setMyProfile(profile);
    setPublishOpen(false);
    showToast("技能已发布，看看谁和你互相需要。");
  };

  const pendingFor = (userId: string) =>
    invitations.find(
      (item) =>
        item.targetUserId === userId &&
        item.status === "pending" &&
        item.myTeachSkillId === myProfile?.teachSkillId &&
        item.partnerTeachSkillId === MEMBERS.find((m) => m.id === userId)?.teachSkillId,
    );

  const sendInvite = (partner: Profile) => {
    if (!myProfile || sending) return;
    if (pendingFor(partner.id)) return;
    setSending(true);
    const invitation: Invitation = {
      id: `${Date.now()}-${partner.id}`,
      targetUserId: partner.id,
      targetNickname: partner.nickname,
      myTeachSkillId: myProfile.teachSkillId,
      partnerTeachSkillId: partner.teachSkillId,
      myTeachDescription: myProfile.teachDescription,
      partnerTeachDescription: partner.teachDescription,
      message: inviteMessage.trim().slice(0, 120),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const next = [invitation, ...invitations];
    if (!persist(KEYS.invitations, next)) {
      setSending(false);
      return;
    }
    setInvitations(next);
    setSending(false);
    setConfirmInvite(false);
    showToast("邀请已保存。本体验使用示例伙伴，不会向真实用户发送通知。");
  };

  const withdraw = (id: string) => {
    const next = invitations.map((item) =>
      item.id === id && item.status === "pending" ? { ...item, status: "withdrawn" as const } : item,
    );
    if (!persist(KEYS.invitations, next)) return;
    setInvitations(next);
    showToast("邀请已撤回，如需可以重新发出。");
  };

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    if (!persist(KEYS.favorites, next)) return;
    setFavorites(next);
  };

  const resetDemo = () => {
    try {
      localStorage.removeItem(KEYS.profile);
      localStorage.removeItem(KEYS.invitations);
      localStorage.removeItem(KEYS.favorites);
    } catch {
      setStorageError("无法清除本地数据");
      return;
    }
    setMyProfile(null);
    setInvitations([]);
    setFavorites([]);
    setFilter("all");
    setQuery("");
    setDetail(null);
    setPublishOpen(false);
    setConfirmInvite(false);
    showToast("演示数据已重置。");
  };

  const listed = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let items = [...MEMBERS];
    if (filter === "match") items = items.filter((m) => isMatch(myProfile, m));
    if (filter === "favorites") items = items.filter((m) => favorites.includes(m.id));
    if (keyword) {
      items = items.filter((m) => {
        const hay = `${m.nickname}${skillName(m.teachSkillId)}${skillName(m.learnSkillId)}`.toLowerCase();
        return hay.includes(keyword);
      });
    }
    if (myProfile && filter === "all") {
      items.sort((a, b) => Number(isMatch(myProfile, b)) - Number(isMatch(myProfile, a)));
    }
    return items;
  }, [filter, favorites, myProfile, query]);

  const matchCount = myProfile ? MEMBERS.filter((m) => isMatch(myProfile, m)).length : 0;

  const scrollToMatches = () => {
    setFilter("match");
    setPage("discover");
    window.setTimeout(() => {
      document.getElementById("partner-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  return (
    <div className="page">
      <header className="nav">
        <div className="nav-inner">
          <div className="logo">换个技能</div>
          <nav className="tabs">
            <button className={page === "discover" ? "tab on" : "tab"} onClick={() => setPage("discover")}>
              发现技能
            </button>
            <button className={page === "exchanges" ? "tab on" : "tab"} onClick={() => setPage("exchanges")}>
              我的交换
            </button>
          </nav>
          <button className="btn primary nav-cta" onClick={openPublish}>
            {myProfile ? "编辑我的技能" : "发布我的技能"}
          </button>
        </div>
      </header>

      <p className="banner">体验原型 · 成员为示例数据 · 你的操作保存在当前浏览器</p>
      {storageError ? <p className="banner error">{storageError}</p> : null}

      {page === "discover" ? (
        <main className="wrap">
          <section className="hero">
            <span className="pill">技能互换 · 一起进步</span>
            <h1>用你擅长的，换你想学的。</h1>
            <p className="lead">找到彼此需要的学习伙伴，从一次各 30 分钟的交流开始。</p>
            {myProfile ? (
              <button className="btn primary" onClick={scrollToMatches}>
                查看我的匹配
              </button>
            ) : (
              <button className="btn primary" onClick={openPublish}>
                发布我的技能
              </button>
            )}
          </section>

          <section className="me-bar">
            {myProfile ? (
              <div className="me-row">
                <span>
                  我能教：<b>{skillName(myProfile.teachSkillId)}</b>
                  <span className="swap"> ↔ </span>
                  我想学：<b>{skillName(myProfile.learnSkillId)}</b>
                </span>
                <button className="link" onClick={openPublish}>
                  编辑
                </button>
              </div>
            ) : (
              <p>你擅长什么，又想学什么？发布后即可查看双向匹配。</p>
            )}
          </section>

          <section id="partner-list" className="toolbar">
            <div className="filters">
              <button className={filter === "all" ? "chip on" : "chip"} onClick={() => setFilter("all")}>
                全部伙伴
              </button>
              <button className={filter === "match" ? "chip on" : "chip"} onClick={() => setFilter("match")}>
                双向匹配
              </button>
              <button
                className={filter === "favorites" ? "chip on" : "chip"}
                onClick={() => setFilter("favorites")}
              >
                我的收藏
              </button>
            </div>
            <input
              className="search"
              placeholder="搜索姓名或技能"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </section>

          {filter === "match" && !myProfile ? (
            <div className="empty">
              <p>先发布你的技能，才能找到彼此需要的伙伴。</p>
              <button className="btn primary" onClick={openPublish}>
                发布我的技能
              </button>
            </div>
          ) : filter === "match" && matchCount === 0 ? (
            <div className="empty">
              <p>暂时没有双向匹配的伙伴。试试调整想学的技能，或先看看其他成员。</p>
              <div className="row">
                <button className="btn primary" onClick={openPublish}>
                  编辑技能
                </button>
                <button className="btn ghost" onClick={() => setFilter("all")}>
                  查看全部
                </button>
              </div>
            </div>
          ) : filter === "favorites" && listed.length === 0 ? (
            <div className="empty">
              <p>还没有收藏的伙伴。可以先在卡片上点亮收藏。</p>
            </div>
          ) : listed.length === 0 ? (
            <div className="empty">
              <p>没有符合条件的伙伴，试试换个关键词。</p>
            </div>
          ) : (
            <section className="grid">
              {listed.map((member) => {
                const matched = isMatch(myProfile, member);
                return (
                  <article className="card" key={member.id}>
                    <div className="card-top">
                      <div className="avatar" style={{ background: avatarColor(member.nickname) }}>
                        {member.nickname.slice(0, 1)}
                      </div>
                      <div>
                        <h3>{member.nickname}</h3>
                        <p className="bio">{member.bio}</p>
                      </div>
                      <button
                        className={favorites.includes(member.id) ? "fav on" : "fav"}
                        onClick={() => toggleFavorite(member.id)}
                        aria-label="收藏"
                      >
                        {favorites.includes(member.id) ? "已收藏" : "收藏"}
                      </button>
                    </div>
                    <div className="tags">
                      <span className="tag teach">我能教：{skillName(member.teachSkillId)}</span>
                      <span className="tag learn">我想学：{skillName(member.learnSkillId)}</span>
                    </div>
                    <p className="meta">线上交流 · 双方各 30 分钟</p>
                    {matched ? (
                      <div className="match-badge">
                        双向匹配：你教{skillName(myProfile!.teachSkillId)}，TA 教{skillName(member.teachSkillId)}
                      </div>
                    ) : null}
                    <button
                      className="btn ghost full"
                      onClick={() => {
                        setDetail(member);
                        setConfirmInvite(false);
                        setInviteMessage(DEFAULT_INVITE_MESSAGE);
                      }}
                    >
                      查看详情
                    </button>
                  </article>
                );
              })}
            </section>
          )}

          <div className="reset-row">
            <button className="link" onClick={resetDemo}>
              重置演示数据
            </button>
          </div>
        </main>
      ) : (
        <main className="wrap">
          <section className="hero compact">
            <h1>我的交换</h1>
            <p className="lead">查看你发出的邀请，找到下一次共同进步的机会。</p>
          </section>
          {invitations.length === 0 ? (
            <div className="empty">
              <p>还没有交换邀请。先找到一个你能帮助、也能帮助你的伙伴。</p>
              <button className="btn primary" onClick={() => setPage("discover")}>
                去发现技能
              </button>
            </div>
          ) : (
            <section className="invite-list">
              {invitations.map((item) => (
                <article className="card invite" key={item.id}>
                  <div className="invite-head">
                    <h3>{item.targetNickname}</h3>
                    <span className={item.status === "pending" ? "status pending" : "status withdrawn"}>
                      {item.status === "pending" ? "待回应" : "已撤回"}
                    </span>
                  </div>
                  <p>
                    {skillName(item.myTeachSkillId)} ↔ {skillName(item.partnerTeachSkillId)}
                  </p>
                  <p className="bio">{item.message || "（无留言）"}</p>
                  <p className="meta">{formatTime(item.createdAt)}</p>
                  {item.status === "pending" ? (
                    <button className="btn ghost" onClick={() => withdraw(item.id)}>
                      撤回邀请
                    </button>
                  ) : null}
                </article>
              ))}
            </section>
          )}
        </main>
      )}

      {publishOpen ? (
        <Modal title={myProfile ? "编辑我的技能" : "发布我的技能"} onClose={() => setPublishOpen(false)}>
          <label>
            昵称
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              maxLength={12}
            />
            {errors.nickname ? <em>{errors.nickname}</em> : null}
          </label>
          <label>
            我能教的技能
            <select
              value={form.teachSkillId}
              onChange={(e) => setForm({ ...form, teachSkillId: e.target.value as SkillId })}
            >
              {SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.teachSkillId ? <em>{errors.teachSkillId}</em> : null}
          </label>
          <label>
            我想学的技能
            <select
              value={form.learnSkillId}
              onChange={(e) => setForm({ ...form, learnSkillId: e.target.value as SkillId })}
            >
              {SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.learnSkillId ? <em>{errors.learnSkillId}</em> : null}
          </label>
          <label>
            我能教的具体内容
            <textarea
              rows={3}
              value={form.teachDescription}
              onChange={(e) => setForm({ ...form, teachDescription: e.target.value })}
              maxLength={120}
            />
            {errors.teachDescription ? <em>{errors.teachDescription}</em> : null}
          </label>
          <label>
            我希望学会什么
            <textarea
              rows={3}
              value={form.learnGoal}
              onChange={(e) => setForm({ ...form, learnGoal: e.target.value })}
              maxLength={120}
            />
            {errors.learnGoal ? <em>{errors.learnGoal}</em> : null}
          </label>
          <button className="btn primary full" onClick={submitProfile}>
            {myProfile ? "保存更新" : "发布技能"}
          </button>
        </Modal>
      ) : null}

      {detail ? (
        <Modal
          title={detail.nickname}
          onClose={() => {
            setDetail(null);
            setConfirmInvite(false);
          }}
        >
          <p className="bio">{detail.bio}</p>
          <div className="tags">
            <span className="tag teach">TA 能教：{skillName(detail.teachSkillId)}</span>
            <span className="tag learn">TA 想学：{skillName(detail.learnSkillId)}</span>
          </div>
          <p>
            <b>具体内容：</b>
            {detail.teachDescription}
          </p>
          <p>
            <b>学习目标：</b>
            {detail.learnGoal}
          </p>
          <p>
            <b>交换方式：</b>线上
          </p>
          <p>
            <b>交换建议：</b>双方各提供 30 分钟体验教学，具体时间后续协商。
          </p>
          <p className="explain">
            {isMatch(myProfile, detail)
              ? `你可以教${detail.nickname}${skillName(myProfile!.teachSkillId)}，${detail.nickname}可以教你${skillName(detail.teachSkillId)}。`
              : "你们目前还没有形成双向技能匹配。"}
          </p>

          {!myProfile ? (
            <button
              className="btn primary full"
              onClick={() => {
                setDetail(null);
                openPublish();
              }}
            >
              先发布我的技能
            </button>
          ) : pendingFor(detail.id) ? (
            <button
              className="btn primary full"
              onClick={() => {
                setDetail(null);
                setPage("exchanges");
              }}
            >
              查看已发邀请
            </button>
          ) : isMatch(myProfile, detail) ? (
            confirmInvite ? (
              <div className="confirm">
                <p>
                  我提供：{skillName(myProfile.teachSkillId)} · {myProfile.teachDescription}
                </p>
                <p>
                  对方提供：{skillName(detail.teachSkillId)} · {detail.teachDescription}
                </p>
                <p>双方各 30 分钟，具体时间待协商。</p>
                <label>
                  邀请留言（选填）
                  <textarea
                    rows={3}
                    maxLength={120}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                  />
                </label>
                <button className="btn primary full" disabled={sending} onClick={() => sendInvite(detail)}>
                  {sending ? "提交中…" : "确认发出邀请"}
                </button>
              </div>
            ) : (
              <button className="btn primary full" onClick={() => setConfirmInvite(true)}>
                发起交换邀请
              </button>
            )
          ) : (
            <button
              className="btn primary full"
              onClick={() => {
                setDetail(null);
                openPublish();
              }}
            >
              调整我的技能
            </button>
          )}
        </Modal>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
