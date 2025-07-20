import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  const processEnv = {
    env: {
      NEXT_PUBLIC_GOVTOKEN_ADDRESS: process.env.NEXT_PUBLIC_GOVTOKEN_ADDRESS,
      NEXT_PUBLIC_REWARDTOKEN_ADDRESS: process.env.NEXT_PUBLIC_REWARDTOKEN_ADDRESS,
      NEXT_PUBLIC_PARTICIPATIONNFT_ADDRESS: process.env.NEXT_PUBLIC_PARTICIPATIONNFT_ADDRESS,
      NEXT_PUBLIC_GOVERNANCE_ADDRESS: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS,
      NEXT_PUBLIC_LOTTERY_ADDRESS: process.env.NEXT_PUBLIC_LOTTERY_ADDRESS,
      NEXT_PUBLIC_STATUSNFT_ADDRESS: process.env.NEXT_PUBLIC_STATUSNFT_ADDRESS
    }
  }

  console.log('这里是服务端注入的环境变量发给客户端的地方 =>', JSON.stringify(processEnv))

  return (
    <Html lang="zh">
      <Head />
      <body>
        <script 
          id="initState"
          dangerouslySetInnerHTML={{
            __html: `
              console.log("初始化环境变量...");
              try {
                window.process = ${JSON.stringify(processEnv)};
                console.log("环境变量注入成功:", window.process);
              } catch(e) {
                console.error("环境变量注入失败:", e);
              }
            `
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}