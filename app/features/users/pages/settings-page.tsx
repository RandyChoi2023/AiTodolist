import InputPair from "~/common/components/input-pair";
import SelectPair from "~/common/components/select-pair";
import type { Route } from "./+types/settings-page";
import { Form } from "react-router";
import { useMemo, useState } from "react";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Button } from "~/common/components/ui/button";

// ---- Role descriptions (Die Empty-inspired) ----
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


export const meta: Route.MetaFunction = () => {
  return [{ title: "Settings | AI todo list" }];
};

export default function SettingsPage() {
  const [avatar, setAvatar] = useState<string | null>(null);

  // Role state (for showing description under Select)
  const [selectedRole, setSelectedRole] = useState<
    "developer" | "driver" | "drifter" | "dreamer" | "other" | null
  >(null);

  const roleInfo = useMemo(() => {
    if (!selectedRole) return null;
    if (selectedRole === "other") return null;
    return ROLE_DESCRIPTIONS[selectedRole];
  }, [selectedRole]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-20">
      <div className="grid grid-cols-6 gap-40">
        <div className="col-span-4 flex flex-col gap-10">
          <h2 className="text-2xl font-semibold">Edit profile</h2>

          <Form className="flex flex-col w-1/2 gap-5">
            <InputPair
              label="Name"
              description="Your name"
              required
              id="name"
              name="name"
              placeholder="John Doe"
            />

            <SelectPair
              label="Role"
              description="What role do you identify the most with"
              name="role"
              placeholder="Select a role"
              options={[
                { label: "Developer", value: "developer" },
                { label: "Driver", value: "driver" },
                { label: "Drifter", value: "drifter" },
                { label: "Dreamer", value: "dreamer" },
                { label: "Other", value: "other" },
              ]}
              // ✅ IMPORTANT: SelectPair must support this prop
              onValueChange={(value) =>
                setSelectedRole(
                  (value as
                    | "developer"
                    | "driver"
                    | "drifter"
                    | "dreamer"
                    | "other") ?? null
                )
              }
            />

            {/* ✅ Role description 바로 아래 */}
            {selectedRole ? (
              roleInfo ? (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="font-semibold">{roleInfo.title}</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {roleInfo.description}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="font-semibold">Other</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    아직 역할이 애매하면 Other로 두고, 나중에 AI가 추천해주는 스타일을 보면서
                    다시 바꿔도 돼.
                  </p>
                </div>
              )
            ) : null}

            <InputPair
              label="Bio"
              description="Your public bio. It will be displayed on your profile page"
              required
              id="bio"
              name="bio"
              placeholder="John Doe"
              textArea
            />

            <Button className="w-full">Update profile</Button>
          </Form>
        </div>

        <aside className="col-span-2 p-6 rounded-lg border shadow-md">
          <span className="text-sm font-bold text-muted-foreground uppercase">
            <Label className="text-muted-foreground">
              Avatar
              <small className="text-muted-foreground">This is your public avatar</small>
            </Label>
          </span>

          <div className="space-y-5">
            <div className="size-40 rounded-full shadow-xl overflow-hidden">
              {avatar ? <img src={avatar} className="object-cover w-full h-full" /> : null}
            </div>

            <Input type="file" className="w-1/2" onChange={onChange} required name="icon" />

            <div className="flex flex-col text-us">
              <span className="text-muted-foreground">Recommended size: 128x128px</span>
              <span className="text-muted-foreground">Allowed formats: PNG, JPEG</span>
              <span className="text-muted-foreground">Max file size: 1MB</span>
            </div>

            <Button className="w-full">Update avatar</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
