"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Vote,
  Zap,
  Image,
  Shield,
  Coins,
  Users,
  Trophy,
  Sparkles,
  ArrowRight,
  Github,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useProposalCount } from "@/hooks/useGovernance";
import {
  usePrizeInfo,
  useParticipants,
  useIsParticipant,
} from "@/hooks/useLottery";
import { toast } from 'sonner'
import { useRouter } from "next/navigation";
import { ConnectButton } from '@/components/wallet/ConnectButton';

const features = [
  {
    icon: Vote,
    title: "去中心化治理",
    description: "基于代币的投票机制，社区共同决策项目发展方向",
    color: "from-primary to-purple-400",
  },
  {
    icon: Zap,
    title: "公平抽奖系统",
    description: "透明的链上抽奖，算法确保每个参与者机会平等",
    color: "from-secondary to-blue-400",
  },
  {
    icon: Image,
    title: "NFT激励机制",
    description: "参与即获得NFT，不同等级享受不同权益和奖励",
    color: "from-accent to-pink-400",
  },
  {
    icon: Shield,
    title: "智能合约保障",
    description: "所有逻辑运行在区块链上，代码开源可审计",
    color: "from-green-400 to-emerald-400",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { address } = useAccount();
  const { count: proposalCount, isError: isProposalError } = useProposalCount();
  const {
    prizeInfo,
    isError: isPrizeError,
    isLoading: isPrizeLoading,
  } = usePrizeInfo();
  const {
    participantCount,
    isError: isParticipantError,
    isLoading: isParticipantLoading,
  } = useParticipants();
  const { isParticipant, isError: isParticipantCheckError } =
    useIsParticipant();

  // 处理加载和错误状态
  const isLoading = isPrizeLoading || isParticipantLoading;
  const hasError =
    isProposalError ||
    isPrizeError ||
    isParticipantError ||
    isParticipantCheckError;

  // 真实统计数据
  const stats = [
    {
      label: "总参与用户",
      value: isLoading
        ? "..."
        : hasError
        ? "错误"
        : participantCount.toString(),
      icon: Users,
    },
    {
      label: "累计奖池",
      value: isLoading
        ? "..."
        : hasError
        ? "错误"
        : prizeInfo.totalPrize.toString(),
      unit: "REWARD",
      icon: Coins,
    },
    {
      label: "当前奖励",
      value: isLoading
        ? "..."
        : hasError
        ? "错误"
        : prizeInfo.rewardAmount.toString(),
      unit: "REWARD",
      icon: Trophy,
    },
    {
      label: "治理提案",
      value: isLoading ? "..." : hasError ? "错误" : proposalCount.toString(),
      icon: Vote,
    },
  ];

  // 如果有错误，显示重试按钮
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* 背景效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* 徽章 */}
            <Badge
              variant="glow"
              className="mb-6 bg-primary/20 text-primary border-primary/30"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Web3 DAO 创新项目
            </Badge>

            {/* 标题 */}
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              DAO Lottery
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                {" "}
                Plus
              </span>
            </h1>

            {/* 描述 */}
            <p className="mt-6 text-lg leading-8 text-gray-300 sm:text-xl">
              基于区块链的去中心化抽奖治理平台
              <br />
              参与治理，赢取奖励，收集NFT，共建未来
            </p>

            {/* CTA按钮 */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <ConnectButton />
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() =>
                  window.open(
                    "https://github.com/CurtisYan/dao-lottery-plus",
                    "_blank"
                  )
                }
              >
                <Github className="w-4 h-4 mr-2" />
                查看代码
              </Button>
              {/* 添加错误重试按钮 */}
              {hasError && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleRetry}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  重试
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  variant="glass"
                  hover
                  className="text-center group"
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center group-hover:animate-glow">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                      {stat.unit && (
                        <span className="text-sm text-gray-400 ml-1">
                          {stat.unit}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              核心特性
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              集治理、抽奖、NFT于一体的创新DeFi平台
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} variant="glow" hover className="group">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:animate-glow`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="neon" className="text-center">
            <CardContent className="py-16">
              <h3 className="text-3xl font-bold text-white mb-4">
                准备开始了吗？
              </h3>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                连接钱包，参与治理投票，赢取丰厚奖励，收集独特NFT
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  glow
                  onClick={() => router.push("/governance")}
                >
                  了解更多
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
