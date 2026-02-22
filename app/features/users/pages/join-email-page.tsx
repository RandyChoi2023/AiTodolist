import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
    pixelBasedPreset,
  } from "@react-email/components";
  
  
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  type JoinEmailProps = {
    username: string;
    baseUrl: string; // ✅ 추가
  };
  
  
  export const JoinEmail = ({ username, baseUrl }: JoinEmailProps) => {
    const steps = [
      {
        id: 1,
        title: "첫 번째 목표 만들기",
        desc: (
          <>
            진짜 개선하고 싶은 한 가지를 골라봐. 건강, 영어, 코딩—뭐든 OK.
            <br />
            <strong>작고 명확할수록</strong> 오래 간다. 예: “주 3회 달리기”, “IELTS 20분 공부”.
          </>
        ),
        href: `${baseUrl}/app/goals/new`,
        linkText: "목표 만들기",
      },
      {
        id: 2,
        title: "AI로 오늘의 계획 생성하기",
        desc: (
          <>
            목표를 <strong>실행 가능한 일일 계획</strong>으로 바꿔봐.
            AI가 바쁜 날에도 끝낼 수 있는 <strong>아주 작은 단계</strong>를 제안해줘.
            <br />
            <span className="text-gray-600">
              참고: AI 생성은 <strong>주간 3회</strong>로 제한돼. 그래서 “정말 중요한 목표”에 쓰는 게 효율적이야.
            </span>
          </>
        ),
        href: `${baseUrl}/app/ai/plan`,
        linkText: "AI 계획 생성",
      },
      {
        id: 3,
        title: "체크하고 streak 쌓기",
        desc: (
          <>
            할 일을 완료하면 체크해줘. 그러면 <strong>연속 달성(streak)</strong>이 쌓이기 시작해.
            <br />
            작은 성공은 생각보다 빠르게 커진다. (Small wins compound fast.)
          </>
        ),
        href: `${baseUrl}/app`,
        linkText: "대시보드로 이동",
      },
      {
        id: 4,
        title: "알림 설정하기 (선택)",
        desc: (
          <>
            아침/점심/저녁 중 원하는 시간에 알림을 설정해봐.
            앱이 <strong>조용하지만 정확하게</strong> 툭—하고 알려줄 거야.
          </>
        ),
        href: `${baseUrl}/app/settings/notifications`,
        linkText: "알림 설정",
      },
    ];
  
    const quickLinks = [
      { title: "대시보드", href: `${baseUrl}/app` },
      { title: "목표 만들기", href: `${baseUrl}/app/goals/new` },
      { title: "도움말 / 문서", href: `${baseUrl}/docs` },
    ];
  
    return (
      <Html>
        <Head />
        <Tailwind
          config={{
            presets: [pixelBasedPreset],
            theme: {
              extend: {
                colors: {
                  brand: "#7c3aed", // violet-600
                  offwhite: "#fafbfb",
                  ink: "#111827", // gray-900
                  muted: "#6b7280", // gray-500
                  line: "#e5e7eb", // gray-200
                },
                spacing: {
                  0: "0px",
                  20: "20px",
                  32: "32px",
                  45: "45px",
                },
              },
            },
          }}
        >
          {/* ✅ 미리보기 문구: 메일 리스트에서 보이는 한 줄 */}
          <Preview>{`AI To-Do List에 오신 것을 환영합니다, ${username}님 🎉 오늘 1개만 끝내봐요.`}</Preview>
  
          <Body className="bg-offwhite font-sans text-base text-ink">
            {/* Logo / Header */}
            {/* <Img
              src={`${baseUrl}/static/ai-todo-logo.png`}
              width="180"
              height="48"
              alt="AI To-Do List"
              className="mx-auto my-20"
            /> */}
            <Section className="text-center my-20">
            <Text className="m-0 text-2xl font-extrabold text-brand">
                AI To-Do List
            </Text>
            <Text className="m-0 mt-2 text-sm text-muted">
                Start small. Finish one today.
            </Text>
            </Section>
            
            <Container className="bg-white p-45">
              <Heading className="my-0 text-center leading-8">
                AI To-Do List에 오신 것을 환영합니다, {username}님 👋
              </Heading>
  
              <Text className="mt-20 text-base text-muted">
                가입 완료! 이 앱은 “완벽”이 아니라 <strong>“오늘 하나를 끝내는 것”</strong>에 집중하도록 설계됐어.
                <br />
                오늘 한 걸음이면 충분해. (One step today is enough.)
              </Text>
  
              <Hr className="my-32 border-line" />
  
              <Section>
                <Row>
                  <Text className="text-base font-semibold">🚀 시작을 위한 간단한 가이드</Text>
                </Row>
              </Section>
  
              <ul className="m-0 p-0">
                {steps.map((s) => (
                  <li className="mb-20 list-none" key={s.id}>
                    <Text className="m-0 text-base">
                      <strong>
                        {s.id}️⃣ {s.title}
                      </strong>
                      <br />
                      {s.desc}{" "}
                      <Link className="font-semibold text-brand underline" href={s.href}>
                        {s.linkText} →
                      </Link>
                    </Text>
                  </li>
                ))}
              </ul>
  
              <Section className="text-center">
                <Button
                  href={`${baseUrl}/app`}
                  className="rounded-lg bg-brand px-[18px] py-3 text-white"
                >
                  대시보드 열기
                </Button>
              </Section>
  
              <Text className="mt-20 text-sm text-muted">
                💡 Tip: 막히는 순간이 오면 <strong>“2분짜리 작업”</strong>을 만들어봐.
                <br />
                시작하는 것 자체가 이미 성공이야.
              </Text>
  
              <Section className="mt-45">
                <Row>
                  {quickLinks.map((l) => (
                    <Column key={l.title}>
                      <Link className="font-bold text-ink underline" href={l.href}>
                        {l.title}
                      </Link>{" "}
                      <span className="text-gray-400">→</span>
                    </Column>
                  ))}
                </Row>
              </Section>
  
              <Hr className="my-32 border-line" />
  
              <Text className="m-0 text-sm text-muted">
                감사합니다. 오늘의 작은 실행을 응원합니다 💜
                <br />– AI To-Do List 팀 드림
              </Text>
            </Container>
  
            {/* Footer */}
            <Container className="mt-20">
              <Section>
                <Row>
                  <Column className="px-20 text-right">
                    <Link className="text-muted underline" href={`${baseUrl}/unsubscribe`}>
                      이메일 수신 거부
                    </Link>
                  </Column>
                  <Column className="text-left">
                    <Link className="text-muted underline" href={`${baseUrl}/preferences`}>
                      알림/이메일 설정 관리
                    </Link>
                  </Column>
                </Row>
              </Section>
  
              <Text className="mb-45 text-center text-gray-400">
                AI To-Do List • {baseUrl ? baseUrl.replace("https://", "") : "Your App"}
                <br />
                이 이메일은 AI To-Do List 가입 후 자동으로 발송되었습니다.
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default JoinEmail;