"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { 
  Calendar, 
  Zap, 
  Coins, 
  Clock,
  Vote,
  FileText,
  Share2,
  MessageCircle,
  Users,
  Check,
  Sparkles,
  Loader2,
  Award,
  Star,
  ArrowRight,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAccount, useConfig, useReadContracts, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { formatEther } from '@/lib/utils';
import { formatUnits, parseUnits } from 'viem';
import { toast } from 'sonner';
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useGovBalance } from '@/hooks/useGovBalance';
import { stringToHex } from 'viem';

// 任务类型和数据
const tasks = [
  {
    id: "daily-check-in",
    title: "每日签到",
    description: "每天登录系统签到一次",
    reward: 1,
    icon: Calendar,
    color: "primary",
    defaultCooldownSeconds: 24 * 60 * 60,
    difficulty: "简单",
    estimatedTime: "1分钟",
    category: "日常",
    type: "daily",
    repeatable: true,
  },
  {
    id: "vote-proposal",
    title: "参与提案投票",
    description: "对任意活跃提案进行投票",
    reward: 5,
    icon: Vote,
    color: "secondary",
    defaultCooldownSeconds: 0,
    difficulty: "简单",
    estimatedTime: "5分钟",
    category: "治理",
    type: "governance",
    repeatable: true,
  },
  {
    id: "create-proposal",
    title: "创建治理提案",
    description: "提交一个新的社区治理提案",
    reward: 20,
    icon: FileText,
    color: "accent",
    defaultCooldownSeconds: 7 * 24 * 60 * 60,
    difficulty: "中等",
    estimatedTime: "30分钟",
    category: "治理",
    type: "governance",
    repeatable: true,
  },
  {
    id: "share-project",
    title: "分享项目",
    description: "在社交媒体上分享DAO Lottery项目",
    reward: 5,
    icon: Share2,
    color: "success",
    defaultCooldownSeconds: 24 * 60 * 60,
    difficulty: "简单",
    estimatedTime: "2分钟",
    category: "社区",
    type: "community",
    repeatable: true,
  },
  {
    id: "feedback",
    title: "提供反馈",
    description: "为DAO Lottery提供功能改进建议",
    reward: 10,
    icon: MessageCircle,
    color: "warning",
    defaultCooldownSeconds: 3 * 24 * 60 * 60,
    difficulty: "中等",
    estimatedTime: "10分钟",
    category: "社区",
    type: "community",
    repeatable: true,
  },
  {
    id: "invite-friend",
    title: "邀请朋友",
    description: "邀请新用户加入DAO Lottery",
    reward: 15,
    icon: Users,
    color: "accent",
    defaultCooldownSeconds: 0,
    difficulty: "中等",
    estimatedTime: "5分钟",
    category: "社区",
    type: "community",
    repeatable: true,
  },
  {
    id: "join-discord",
    title: "加入Discord社区",
    description: "加入并验证Discord社区成员身份",
    reward: 3,
    icon: Users,
    color: "accent",
    defaultCooldownSeconds: 0,
    difficulty: "简单",
    estimatedTime: "5分钟",
    category: "community",
    type: "community",
    repeatable: false,
  },
  {
    id: "share-twitter",
    title: "社交媒体分享",
    description: "在Twitter上分享项目",
    reward: 2,
    icon: Share2,
    color: "accent",
    defaultCooldownSeconds: 72 * 60 * 60,
    difficulty: "简单",
    estimatedTime: "2分钟",
    category: "community",
    type: "community",
    repeatable: true,
  },
];

const GOV_UNIT = parseUnits('1', 18);

const GOVERNANCE_TASK_GET_ABI = [
  {
    "inputs": [
      { "name": "_taskId", "type": "bytes32" }
    ],
    "name": "getTask",
    "outputs": [
      { "name": "reward", "type": "uint256" },
      { "name": "cooldown", "type": "uint256" },
      { "name": "active", "type": "bool" },
      { "name": "repeatable", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const GOVERNANCE_TASK_STATUS_ABI = [
  {
    "inputs": [
      { "name": "_user", "type": "address" },
      { "name": "_taskId", "type": "bytes32" }
    ],
    "name": "getTaskLastCompletion",
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const GOVERNANCE_TASK_WRITE_ABI = [
  {
    "inputs": [
      { "name": "_taskId", "type": "bytes32" }
    ],
    "name": "completeTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
// 会员等级显示组件
const MembershipCard = ({ level, levelLabel, progress, govBalance, memberDays }: {
  level: string,
  levelLabel: string,
  progress: number,
  govBalance: string,
  memberDays: number
}) => {
  return (
    <Card variant="neon" className="mb-8">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{level}</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  {memberDays} 天
                </Badge>
                <Badge variant="secondary">
                  <Coins className="w-3 h-3 mr-1" />
                  {govBalance} GOV
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">等级进度</span>
              <Badge variant="secondary">
                {levelLabel}
              </Badge>
            </div>
            <Progress 
              value={progress} 
              max={100}
              variant="primary"
              size="md"
              showLabel
              label={`${progress}%`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TaskCard = ({
  task,
  onComplete,
  canComplete,
  cooldownRemaining,
  rewardAmount,
  isProcessing,
  active,
  repeatable,
  completed
}: {
  task: typeof tasks[0],
  onComplete: () => Promise<void>,
  canComplete: boolean,
  cooldownRemaining: number,
  rewardAmount: string,
  isProcessing: boolean,
  active: boolean,
  repeatable: boolean,
  completed: boolean
}) => {
  const Icon = task.icon;

  const handleComplete = async () => {
    if (!canComplete || isProcessing || !active) return;

    await onComplete();
  };

  // 格式化剩余冷却时间
  const formatCooldown = () => {
    if (cooldownRemaining <= 0) return '';

    const days = Math.floor(cooldownRemaining / (24 * 60 * 60));
    const hours = Math.floor((cooldownRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((cooldownRemaining % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}天${hours}小时后可再次完成`;
    }
    if (hours > 0) {
      return `${hours}小时${minutes}分钟后可再次完成`;
    }
    if (minutes > 0) {
      return `${minutes}分钟后可再次完成`;
    }
    return `不到一分钟后可再次完成`;
  };

  return (
    <Card variant="glass" hover className="group">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-${task.color}/20 to-${task.color}/10 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 text-${task.color}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold">{task.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {task.category}
              </Badge>
            </div>
            <p className="text-gray-400 text-sm">{task.description}</p>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant="secondary" className="text-xs">
                难度: {task.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {task.estimatedTime}
              </Badge>
              <div className="text-accent font-medium flex items-center">
                <Coins className="w-4 h-4 mr-1" />
                {rewardAmount} GOV
              </div>
              {!repeatable && completed && (
                <Badge variant="secondary" className="text-xs">一次性任务</Badge>
              )}
            </div>

            {!active && (
              <div className="text-red-400 text-xs mt-2 flex items-center">
                <RefreshCw className="w-3 h-3 mr-1" />
                任务暂未启用
              </div>
            )}

            {repeatable && cooldownRemaining > 0 && (
              <div className="text-gray-400 text-xs mt-2">
                <Clock className="w-3 h-3 inline mr-1" />
                {formatCooldown()}
              </div>
            )}

            {!repeatable && completed && (
              <div className="text-primary text-xs mt-2 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                已完成此任务
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleComplete}
            disabled={!canComplete || isProcessing || !active}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中
              </>
            ) : !active ? (
              <>
                暂不可用
                <RefreshCw className="w-4 h-4 ml-2" />
              </>
            ) : canComplete ? (
              <>
                完成任务
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : completed ? (
              <>
                已完成
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                冷却中
                <Clock className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function TasksPage() {
  const { address } = useAccount();
  const { balance: govBalanceRaw, refetch: refetchGovBalance } = useGovBalance();
  const govBalanceDisplay = formatEther(govBalanceRaw);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const config = useConfig();

  // 按类别过滤任务
  const [activeCategory, setActiveCategory] = useState<string>("全部");
  const categories = ["全部", "日常", "治理", "社区"];

  const filteredTasks = activeCategory === "全部"
    ? tasks
    : tasks.filter(task => task.category === activeCategory);

  const taskIds = useMemo(
    () => tasks.map((task) => stringToHex(task.id, { size: 32 })),
    []
  );

  const {
    data: taskConfigs,
    refetch: refetchTaskConfigs,
  } = useReadContracts({
    contracts: taskIds.map((taskId) => ({
      address: CONTRACT_ADDRESSES.Governance,
      abi: GOVERNANCE_TASK_GET_ABI,
      functionName: 'getTask',
      args: [taskId],
    })),
  });

  const {
    data: taskCompletion,
    refetch: refetchTaskCompletion,
  } = useReadContracts({
    contracts: address
      ? taskIds.map((taskId) => ({
          address: CONTRACT_ADDRESSES.Governance,
          abi: GOVERNANCE_TASK_STATUS_ABI,
          functionName: 'getTaskLastCompletion',
          args: [address as `0x${string}`, taskId],
        }))
      : [],
    query: {
      enabled: !!address,
    },
  });

  const nowSeconds = Math.floor(Date.now() / 1000);

  const taskStates = tasks.map((task, index) => {
    const chainConfig = taskConfigs?.[index]?.result as
      | readonly [bigint, bigint, boolean, boolean]
      | undefined;
    const reward = chainConfig ? chainConfig[0] : BigInt(task.reward);
    const cooldownSeconds = chainConfig ? Number(chainConfig[1]) : task.defaultCooldownSeconds;
    const active = chainConfig ? chainConfig[2] : true;
    const repeatable = chainConfig ? chainConfig[3] : task.repeatable;
    const completionResult = taskCompletion?.[index]?.result as bigint | undefined;
    const lastCompleted = completionResult ? Number(completionResult) : 0;

    let canComplete = Boolean(address) && active;
    let cooldownRemaining = 0;
    let completed = false;

    if (!address) {
      canComplete = false;
    } else if (!repeatable) {
      completed = lastCompleted > 0;
      canComplete = canComplete && !completed;
    } else {
      if (cooldownSeconds > 0) {
        const availableAt = lastCompleted + cooldownSeconds;
        cooldownRemaining = Math.max(0, availableAt - nowSeconds);
        canComplete = canComplete && nowSeconds >= availableAt;
      } else {
        canComplete = canComplete && nowSeconds > lastCompleted;
      }
    }

    return {
      reward,
      cooldownSeconds,
      active,
      repeatable,
      canComplete,
      cooldownRemaining,
      completed,
    };
  });

  // 会员等级数据
  const levels = [
    { name: "新手", threshold: 0, color: "bg-gray-500" },
    { name: "青铜", threshold: 20, color: "bg-amber-700" },
    { name: "白银", threshold: 50, color: "bg-slate-400" },
    { name: "黄金", threshold: 100, color: "bg-amber-400" },
    { name: "钻石", threshold: 200, color: "bg-blue-500" },
    { name: "王者", threshold: 500, color: "bg-purple-600" },
  ];

  // 获取当前会员等级
  const getCurrentLevel = () => {
    const balance = govBalanceRaw ? parseFloat(formatEther(govBalanceRaw)) : 0;
    let currentLevel = levels[0];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (balance >= levels[i].threshold) {
        currentLevel = levels[i];
        break;
      }
    }
    
    return currentLevel;
  };

  // 获取下一个会员等级
  const getNextLevel = () => {
    const balance = govBalanceRaw ? parseFloat(formatEther(govBalanceRaw)) : 0;

    for (let i = 0; i < levels.length; i++) {
      if (balance < levels[i].threshold) {
        return {
          level: levels[i],
          progress: balance / levels[i].threshold * 100
        };
      }
    }
    
    return {
      level: levels[levels.length - 1],
      progress: 100
    };
  };
  
  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();

  // 处理任务完成
  const handleTaskComplete = async (taskId: string, title: string) => {
    if (!address) {
      toast.error("请先连接钱包");
      return;
    }

    const taskKey = stringToHex(taskId, { size: 32 });

    try {
      setCompletingTask(taskId);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.Governance,
        abi: GOVERNANCE_TASK_WRITE_ABI,
        functionName: 'completeTask',
        args: [taskKey],
      });

      await waitForTransactionReceipt(config, { hash });

      toast.success(`成功完成任务：${title}`);
      await Promise.all([
        refetchTaskCompletion(),
        refetchGovBalance(),
        refetchTaskConfigs(),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(`任务完成失败：${(error as Error).message}`);
    } finally {
      setCompletingTask(null);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
            <Zap className="w-8 h-8 mr-3 text-accent" />
            任务中心
            <Sparkles className="w-6 h-6 ml-2 text-secondary" />
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            完成任务获得GOV代币，提升你的会员等级并解锁更多权益。参与治理和社区建设，共同打造DAO生态。
          </p>
        </div>
        
        {/* 会员信息 */}
          {address && (
            <MembershipCard
              level={currentLevel.name}
              levelLabel={currentLevel.name}
              progress={nextLevel.progress}
              govBalance={govBalanceDisplay}
              memberDays={30}
            />
          )}
        
        {/* 类别筛选 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={activeCategory === category ? "primary" : "secondary"}
              className="text-sm py-1 px-3 cursor-pointer"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
        
        {/* 任务列表 */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            (() => {
              const index = tasks.findIndex((t) => t.id === task.id);
              const state = taskStates[index];
              const rewardLabel = formatUnits(state.reward * GOV_UNIT, 18);

              return (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleTaskComplete(task.id, task.title)}
              canComplete={state.canComplete}
              cooldownRemaining={state.cooldownRemaining}
              rewardAmount={rewardLabel}
              isProcessing={completingTask === task.id}
              active={state.active}
              repeatable={state.repeatable}
              completed={state.completed}
            />
              );
            })()
          ))}
        </div>

        {/* 没有登录时显示提示 */}
        {!address && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-surface/30 flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">连接钱包开始</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              连接你的Web3钱包以查看和完成任务，获取GOV代币奖励。
            </p>
            <ConnectButton>
              <Button 
                size="lg" 
                variant="accent" 
                glow
              >
                连接钱包
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </ConnectButton>
          </div>
        )}
      </div>
    </div>
  );
} 