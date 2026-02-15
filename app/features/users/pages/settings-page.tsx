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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";

import { makeSSRClient } from "~/supa-client";
import type { Database } from "~/supa-client";
import { getUserProfile, updateUserProfile } from "~/features/users/queries";

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

export const meta: Route.MetaFunction = () => [{ title: "Settings | AI To-Do List" }];

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw redirect("/auth/login");

  // ✅ getUserProfile이 null을 반환할 수 있음
  const profile = await getUserProfile(client, user.id);

  // ✅ 화면에서 쓸 안전한 기본값(프로필이 없더라도 페이지는 뜨게)
  const safeProfile: Partial<ProfileRow> = profile ?? {
    profile_id: user.id,
    name: "",
    username: "",
    bio: null,
    avatar: null,
    todo_style: null,
  };

  // email 같은 정보는 필요하면 여기서 같이 내려도 됨
  return { profile: safeProfile, hasProfile: Boolean(profile) };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) throw redirect("/auth/login");

  const fd = await request.formData();
  const intent = String(fd.get("intent") ?? "update-profile");

  try {
    if (intent !== "update-profile") {
      return { ok: false, error: "Unsupported action." };
    }

    const name = String(fd.get("name") ?? "").trim();
    const username = String(fd.get("username") ?? "").trim();
    const bioRaw = String(fd.get("bio") ?? "").trim();
    const avatar = String(fd.get("avatar") ?? "").trim();
    const role = String(fd.get("role") ?? "").trim();

    if (!name) return { ok: false, error: "Name은 필수입니다." };
    if (!username) return { ok: false, error: "Username은 필수입니다." };

    const todo_style =
      role === "developer" ||
      role === "driver" ||
      role === "drifter" ||
      role === "dreamer" ||
      role === "other"
        ? (role as Database["public"]["Enums"]["todo_style"] | "other")
        : null;

    const todoStyleForDb =
      todo_style === "other"
        ? null
        : (todo_style as Database["public"]["Enums"]["todo_style"] | null);

    // ⚠️ 프로필 row가 아예 없으면 update가 실패할 수 있음.
    // 일단 에러를 잡아서 메시지로 보여주고 페이지는 안 죽게 함.
    await updateUserProfile(client, user.id, {
      name,
      username,
      bio: bioRaw ? bioRaw : null,
      avatar: avatar ? avatar : null,
      todo_style: todoStyleForDb,
    });

    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
};

export default function SettingsPage() {
  const { profile, hasProfile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  const [selectedRole, setSelectedRole] = React.useState<
    "developer" | "driver" | "drifter" | "dreamer" | "other" | ""
  >(((profile as any)?.todo_style as any) ?? "");

  const roleInfo =
    selectedRole && selectedRole !== "other"
      ? ROLE_DESCRIPTIONS[selectedRole as keyof typeof ROLE_DESCRIPTIONS] ?? null
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          프로필 정보를 수정하실 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>이 정보는 My Profile 페이지에 표시됩니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!hasProfile ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              현재 프로필 데이터가 아직 생성되어 있지 않습니다. 값을 입력 후 저장을 시도해 주세요.
              (다음 단계에서 “자동 생성(Upsert)”로 더 매끄럽게 개선할 수 있습니다.)
            </div>
          ) : null}

          {actionData?.ok ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              저장이 완료되었습니다.
            </div>
          ) : null}

          {actionData?.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {actionData.error}
            </div>
          ) : null}

          <Form method="post" className="space-y-5">
            <input type="hidden" name="intent" value="update-profile" />

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={(profile as any)?.name ?? ""}
                placeholder="John Doe"
              />
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
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select a role
                </option>
                <option value="developer">Developer</option>
                <option value="driver">Driver</option>
                <option value="drifter">Drifter</option>
                <option value="dreamer">Dreamer</option>
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

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={(profile as any)?.bio ?? ""}
                className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="간단한 소개를 작성해 주세요."
              />
              <p className="text-xs text-muted-foreground">공개 소개글입니다.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                name="avatar"
                defaultValue={(profile as any)?.avatar ?? ""}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                현재는 URL 방식으로 저장합니다. (파일 업로드는 Storage 연결 후 추가하시면 됩니다.)
              </p>
            </div>

            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update profile"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
