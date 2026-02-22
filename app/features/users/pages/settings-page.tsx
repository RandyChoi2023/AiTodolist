import * as React from "react";
import type { Route } from "./+types/settings-page";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Separator } from "~/common/components/ui/separator";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";

import { makeSSRClient } from "~/supa-client";
import type { Database } from "~/supa-client";
import { getUserProfile } from "~/features/users/queries";
import { updateUserAvatar, updateUserProfile } from "~/features/users/mutations";

const ROLE_DESCRIPTIONS: Record<
  "developer" | "driver" | "drifter" | "dreamer",
  { title: string; description: string }
> = {
  developer: {
    title: "Developer",
    description:
      "체계를 만들고 개선하는 것을 선호하시는 유형입니다. 목표를 작은 단계로 나누어 설계하고 실행하며 점진적으로 성장하는 방식이 잘 맞습니다. AI가 체크리스트, 루틴, 자동화 중심으로 할 일을 제안해 드리면 효과적으로 활용하실 수 있습니다.",
  },
  driver: {
    title: "Driver",
    description:
      "목표와 성과 중심으로 움직이시는 유형입니다. 명확한 기한과 구체적인 결과가 있을 때 동기부여가 높아집니다. AI가 데드라인, 우선순위, 수치 기반 목표를 중심으로 To-do를 제안해 드리면 더욱 잘 맞습니다.",
  },
  drifter: {
    title: "Drifter",
    description:
      "자유로움과 유연성을 중요하게 생각하시는 유형입니다. 너무 엄격한 계획보다는 선택의 여지가 있는 구조가 적합합니다. AI가 부담이 적은 옵션형 To-do(여러 선택지 중 선택 가능)를 제안해 드리면 편안하게 실천하실 수 있습니다.",
  },
  dreamer: {
    title: "Dreamer",
    description:
      "비전과 의미를 중요하게 여기는 유형입니다. 큰 그림과 가치에 공감할 때 동기부여가 강해집니다. AI가 목표의 의미와 성장 방향을 연결한 스토리 중심 To-do를 제안해 드리면 지속적으로 실행하시기 좋습니다.",
  },
};

// ✅ DB enum 실제 값
const ENUM = {
  todo_style: ["driver", "dreamer", "developer", "drifter"] as const,
  motivation_type: ["reward", "progress", "meaning"] as const,
  ai_styles: ["soft", "strict", "playful"] as const,
  task_count: ["few", "normal", "many"] as const,
};

// ✅ 라벨(화면 표시용)
const LABELS = {
  todo_style: {
    developer: "Developer (빌더형)",
    driver: "Driver (실행형)",
    drifter: "Drifter (탐색형)",
    dreamer: "Dreamer (비전형)",
  },
  motivation_type: {
    reward: "Reward (보상)",
    progress: "Progress (성장)",
    meaning: "Meaning (의미)",
  },
  ai_styles: {
    soft: "Soft (부드럽게)",
    strict: "Strict (엄격하게)",
    playful: "Playful (재밌게)",
  },
  task_count: {
    few: "Few (적게)",
    normal: "Normal (보통)",
    many: "Many (많이)",
  },
} as const;

export const meta: Route.MetaFunction = () => [
  { title: "Settings | AI To-Do List" },
];

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ActionResult = { intent: string; ok: boolean; error: string | null };

function getImageExtFromFile(file: File) {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  const mimeExt = byMime[file.type];
  if (mimeExt) return mimeExt;

  const nameExt = file.name.split(".").pop()?.toLowerCase();
  if (nameExt && /^[a-z0-9]+$/.test(nameExt)) return nameExt;

  return "png";
}

function isAllowedEnum<T extends readonly string[]>(
  value: string,
  allowed: T
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

function normalizeUsername(u: string) {
  return u.trim();
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw redirect("/auth/login");

  const profile = await getUserProfile(client, user.id);

  const safeProfile: Partial<ProfileRow> = profile ?? {
    profile_id: user.id,
    name: "",
    username: "",
    headline: "",
    bio: null,
    avatar: null,
    todo_style: null,
    motivation_type: null,
    ai_styles: null,
    task_count: null,
  };

  const url = new URL(request.url);
  const onboarding = url.searchParams.get("onboarding") === "1";

  return {
    profile: safeProfile,
    hasProfile: Boolean(profile),
    onboarding,
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw redirect("/auth/login");

  const url = new URL(request.url);
  const onboarding = url.searchParams.get("onboarding") === "1";

  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "update-profile");

  try {
    // ✅ Avatar upload
    if (intent === "upload-avatar") {
      const file = fd.get("avatarFile");

      if (!(file instanceof File)) {
        return {
          intent,
          ok: false,
          error: "업로드할 파일을 선택해 주세요.",
        } satisfies ActionResult;
      }
      if (!file.type.startsWith("image/")) {
        return {
          intent,
          ok: false,
          error: "이미지 파일만 업로드할 수 있습니다.",
        } satisfies ActionResult;
      }

      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxBytes) {
        return {
          intent,
          ok: false,
          error: "파일 용량이 너무 큽니다. (최대 2MB)",
        } satisfies ActionResult;
      }

      const ext = getImageExtFromFile(file);
      const objectPath = `${user.id}/avatar.${ext}`;
      const buf = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(objectPath, buf, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = client.storage.from("avatars").getPublicUrl(objectPath);
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

      await updateUserAvatar(client, user.id, avatarUrl);

      return { intent, ok: true, error: null } satisfies ActionResult;
    }

    // ✅ Profile update
    if (intent !== "update-profile") {
      return {
        intent,
        ok: false,
        error: "지원하지 않는 요청입니다.",
      } satisfies ActionResult;
    }

    const name = String(fd.get("name") ?? "").trim();
    const username = normalizeUsername(String(fd.get("username") ?? ""));
    const headlineRaw = String(fd.get("headline") ?? "").trim();
    const bioRaw = String(fd.get("bio") ?? "").trim();

    // role -> todo_style
    const role = String(fd.get("role") ?? "").trim();

    const motivation_type = String(fd.get("motivation_type") ?? "").trim();
    const ai_styles = String(fd.get("ai_styles") ?? "").trim();
    const task_count = String(fd.get("task_count") ?? "").trim();

    if (!name) {
      return { intent, ok: false, error: "Name은 필수 항목입니다." } satisfies ActionResult;
    }
    if (!username) {
      return { intent, ok: false, error: "Username은 필수 항목입니다." } satisfies ActionResult;
    }

    const todo_style =
      role === "other" || role === ""
        ? null
        : isAllowedEnum(role, ENUM.todo_style)
        ? (role as Database["public"]["Enums"]["todo_style"])
        : null;

    if (role && role !== "other" && !todo_style) {
      return { intent, ok: false, error: "Role(todo_style) 값이 올바르지 않습니다." } satisfies ActionResult;
    }

    const motivationForDb =
      motivation_type && isAllowedEnum(motivation_type, ENUM.motivation_type)
        ? (motivation_type as Database["public"]["Enums"]["motivation_type"])
        : motivation_type
        ? null
        : null;

    if (motivation_type && !motivationForDb) {
      return { intent, ok: false, error: "Motivation type 값이 올바르지 않습니다." } satisfies ActionResult;
    }

    const aiForDb =
      ai_styles && isAllowedEnum(ai_styles, ENUM.ai_styles)
        ? (ai_styles as Database["public"]["Enums"]["ai_styles"])
        : ai_styles
        ? null
        : null;

    if (ai_styles && !aiForDb) {
      return { intent, ok: false, error: "AI styles 값이 올바르지 않습니다." } satisfies ActionResult;
    }

    const taskForDb =
      task_count && isAllowedEnum(task_count, ENUM.task_count)
        ? (task_count as Database["public"]["Enums"]["task_count"])
        : task_count
        ? null
        : null;

    if (task_count && !taskForDb) {
      return { intent, ok: false, error: "Task count 값이 올바르지 않습니다." } satisfies ActionResult;
    }

    await updateUserProfile(client, user.id, {
      name,
      username,
      headline: headlineRaw ? headlineRaw : null,
      bio: bioRaw ? bioRaw : null,
      todo_style,
      motivation_type: motivationForDb,
      ai_styles: aiForDb,
      task_count: taskForDb,
    });

    // ✅ 온보딩일 때 저장 성공하면 goals로 이동
    if (onboarding) throw redirect("/goals");

    return { intent, ok: true, error: null } satisfies ActionResult;
  } catch (e) {
    if (e instanceof Response) throw e;

    return {
      intent,
      ok: false,
      error: e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.",
    } satisfies ActionResult;
  }
};

export default function SettingsPage() {
  const { profile, hasProfile, onboarding } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as ActionResult | undefined;
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  const avatarAction =
    actionData && actionData.intent === "upload-avatar" ? actionData : null;
  const profileAction =
    actionData && actionData.intent === "update-profile" ? actionData : null;

  const [selectedRole, setSelectedRole] = React.useState<
    "developer" | "driver" | "drifter" | "dreamer" | "other" | ""
  >(((profile as any)?.todo_style as any) ?? "");

  const roleInfo =
    selectedRole && selectedRole !== "other"
      ? ROLE_DESCRIPTIONS[selectedRole as keyof typeof ROLE_DESCRIPTIONS] ?? null
      : null;

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const currentAvatar = (profile as any)?.avatar ?? null;

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const missingOnboardingPrefs =
    onboarding &&
    (!((profile as any)?.todo_style) ||
      !((profile as any)?.motivation_type) ||
      !((profile as any)?.ai_styles) ||
      !((profile as any)?.task_count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          프로필 정보를 수정하실 수 있습니다.
        </p>
      </div>

      {/* ✅ Onboarding Card */}
      {onboarding ? (
        <Card className="border-violet-200/40">
          <CardHeader>
            <CardTitle>거의 완료되었습니다 👋</CardTitle>
            <CardDescription>
              Role과 Motivation 설정은 AI가 더 적합한 To-do를 생성하는 데 도움이 됩니다.
              (이후에도 언제든지 변경하실 수 있습니다.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              권장 설정: <strong>Role + Motivation + AI Style + Task Count</strong>
            </div>

            {missingOnboardingPrefs ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                권장 설정 항목이 일부 비어 있습니다. 저장은 가능하지만, AI 생성 결과 품질이 낮아질 수 있습니다.
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                설정이 잘 입력되었습니다. 저장 후 바로 목표를 생성해 보세요.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>이미지 파일을 업로드하여 아바타로 저장합니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border bg-muted/30">
              {previewUrl ? (
                <img src={previewUrl} alt="avatar preview" className="h-full w-full object-cover" />
              ) : currentAvatar ? (
                <img src={currentAvatar} alt="current avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                  No Avatar
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">현재 아바타</div>
              <div className="text-xs text-muted-foreground">
                파일 선택 후 업로드 버튼을 누르시면 저장됩니다.
              </div>
              {!hasProfile ? (
                <div className="text-xs text-destructive">
                  프로필 데이터가 아직 없다면 업로드 후 DB 저장 단계에서 실패할 수 있습니다. 아래 프로필 저장을 먼저 진행해 주세요.
                </div>
              ) : null}
            </div>
          </div>

          <Form method="post" encType="multipart/form-data" className="space-y-4">
            <input type="hidden" name="intent" value="upload-avatar" />

            <div className="space-y-2">
              <Label htmlFor="avatarFile">Upload image</Label>
              <Input
                id="avatarFile"
                name="avatarFile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (!f) {
                    setPreviewUrl(null);
                    return;
                  }
                  const url = URL.createObjectURL(f);
                  setPreviewUrl(url);
                }}
              />
              <p className="text-xs text-muted-foreground">권장: 정사각형 이미지 / 2MB 이하</p>
            </div>

            <Button disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Uploading..." : "Upload avatar"}
            </Button>
          </Form>

          {avatarAction?.ok ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              아바타 저장이 완료되었습니다.
            </div>
          ) : null}

          {avatarAction?.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {avatarAction.error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Edit Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>이 정보는 My Profile 페이지에 표시됩니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!hasProfile ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              현재 프로필 데이터가 아직 생성되어 있지 않습니다. 값을 입력하신 후 저장을 시도해 주세요.
            </div>
          ) : null}

          {profileAction?.ok ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              저장이 완료되었습니다.
            </div>
          ) : null}

          {profileAction?.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {profileAction.error}
            </div>
          ) : null}

          <Form
            method="post"
            className="space-y-5"
            action={onboarding ? "/my/settings?onboarding=1" : undefined}
          >
            <input type="hidden" name="intent" value="update-profile" />

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={(profile as any)?.name ?? ""} placeholder="John Doe" />
              <p className="text-xs text-muted-foreground">표시될 이름입니다.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                defaultValue={(profile as any)?.username ?? ""}
                placeholder="username"
              />
              <p className="text-xs text-muted-foreground">프로필에 표시될 사용자명입니다.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                name="headline"
                defaultValue={(profile as any)?.headline ?? ""}
                placeholder="한 줄 소개 (예: Building AI To-Do List)"
              />
              <p className="text-xs text-muted-foreground">My Profile에서 이름 아래에 표시됩니다.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role (Todo style){" "}
                {onboarding ? <span className="ml-2 text-xs text-violet-600">(권장)</span> : null}
              </Label>

              <select
                id="role"
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  역할을 선택해 주세요
                </option>
                <option value="developer">{LABELS.todo_style.developer}</option>
                <option value="driver">{LABELS.todo_style.driver}</option>
                <option value="drifter">{LABELS.todo_style.drifter}</option>
                <option value="dreamer">{LABELS.todo_style.dreamer}</option>
                <option value="other">Other</option>
              </select>

              <p className="text-xs text-muted-foreground">
                가장 본인과 잘 맞는 역할을 선택해 주세요.
              </p>

              {selectedRole ? (
                roleInfo ? (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <div className="font-semibold">{roleInfo.title}</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {roleInfo.description}
                    </p>
                  </div>
                ) : selectedRole === "other" ? (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <div className="font-semibold">Other</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      아직 자신에게 맞는 역할이 명확하지 않으시다면 Other를 선택하셔도 괜찮습니다.
                      이후 AI가 제안하는 To-do 스타일을 경험해보신 뒤 언제든지 다시 변경하실 수 있습니다.
                    </p>
                  </div>
                ) : null
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="motivation_type">
                  Motivation {onboarding ? <span className="ml-2 text-xs text-violet-600">(권장)</span> : null}
                </Label>
                <select
                  id="motivation_type"
                  name="motivation_type"
                  defaultValue={(profile as any)?.motivation_type ?? ""}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">(미설정)</option>
                  {ENUM.motivation_type.map((v) => (
                    <option key={v} value={v}>
                      {LABELS.motivation_type[v]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">동기 유형</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai_styles">
                  AI style {onboarding ? <span className="ml-2 text-xs text-violet-600">(권장)</span> : null}
                </Label>
                <select
                  id="ai_styles"
                  name="ai_styles"
                  defaultValue={(profile as any)?.ai_styles ?? ""}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">(미설정)</option>
                  {ENUM.ai_styles.map((v) => (
                    <option key={v} value={v}>
                      {LABELS.ai_styles[v]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">AI 말투 톤</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_count">
                  Task count {onboarding ? <span className="ml-2 text-xs text-violet-600">(권장)</span> : null}
                </Label>
                <select
                  id="task_count"
                  name="task_count"
                  defaultValue={(profile as any)?.task_count ?? ""}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">(미설정)</option>
                  {ENUM.task_count.map((v) => (
                    <option key={v} value={v}>
                      {LABELS.task_count[v]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">작업량 선호</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={(profile as any)?.bio ?? ""}
                className="min-h-[120px]"
                placeholder="간단한 소개를 작성해 주세요."
              />
              <p className="text-xs text-muted-foreground">공개 소개글입니다.</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" name="avatar" defaultValue={(profile as any)?.avatar ?? ""} readOnly />
              <p className="text-xs text-muted-foreground">아바타는 위의 업로드 기능으로만 변경됩니다.</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">profiles</Badge>
                <Badge variant="outline">todo_style</Badge>
                <Badge variant="outline">motivation_type</Badge>
                <Badge variant="outline">ai_styles</Badge>
                <Badge variant="outline">task_count</Badge>
              </div>

              <Button disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : onboarding
                  ? "저장하고 시작하기 →"
                  : "Update profile"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}