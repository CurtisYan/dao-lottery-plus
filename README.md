# DAO-Lottery-Plus

## 更新说明

在基础版本上，优化了几个小的设定

- 引入两种NFT，一种是参与贡献的用户都可以获得的ParticipationNFT，另一种是用户威望值（GOV）持有量达到一定数量后可以领取的身份NFT；
- 优化GOV流入途径，取消了新用户默认领取一定GOV，从而导致的刷票行为，GOV的获取途径初始情况下可以是用户贡献转化，例如社区健康发言、积极参与活动推广中获取，建立一个完整的新人成长体系。当然随着社区发展也可以对该模式进行进一步优化，例如后期发表提案来决定新的GOV的获取机制来满足新的社区秩序；
- 优化GOV流出途径，禁止GOV的转账功能，从根本上杜绝了资本介入决策和中心化机构的产生；

**这个模型的巨大优点：**

1. **绝对的女巫攻击免疫**：由于代币不能从市场购买，资本巨鲸无法通过购买来获得投票权。
2. **真正的“贡献证明”**：所有人的GOV都只能通过DAO的grant获得，这意味着每个GOV都代表了一份被社区认可的贡献。
3. **社区纯粹性**：留下的都是真正的建设者，投机者很难有生存空间。

总结，NFT的引入更多的是社区发展层面的拓展，例如参与NFT可以具有实际价值、身份则可以作为一些活动的门槛等等很多衍生机制的基础。而对于GOV的优化想法本质上就是灵魂绑定代币的完美体现。它追求的是一种更纯粹的、基于贡献和声誉的公平治理模式，而不是基于传统资本的治理，更好贯彻DAO的公平理念。

## 前端部分

- 合约代码我已经写好并且做了手动测试，剩下的前端交互部分交给你了
- NFT我已经上传到IPFS，URI我写在配置文件里了
- 采用的是比较主流Hardhat框架，我编写了部署脚本，你可以直接在默认的evm测试网上测试
+ 部署流程：
    - 部署GovToken，传入initialSupply
    - 部署RewardToken，传入initialSupply
    - 部署ParticipationNFT，传入baseURI
    - 部署Governance，传入govToken地址、participationNFT地址
    - 部署Lottery，传入rewardToken地址、governance地址
    - 部署StatusNFT，传入govToken地址
+ 初始化：
    - ParticipationNFT的ownership转移给governance合约
    - GovToken和RewardToken分别设置governance和lottery合约为minter
    - StatusNFT按顺设置baseURI（在env文件里）