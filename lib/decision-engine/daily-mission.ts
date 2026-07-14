import { PrismaClient } from '@prisma/client';

export interface DailyMissionCandidate {
  pageId: string;
  pageUrl: string;
  recommendationType: string;
  expectedBusinessReturn: number;
  estimatedTimeMinutes: number;
  difficulty: number;
  businessValueScore: number;
  seoOpportunityScore: number;
  priorityRank: number;
  reasoning: string;
}

export interface DailyMission {
  pageUrl: string;
  recommendationType: string;
  reasoning: string;
  expectedReturn: number;
  estimatedTime: number;
  difficulty: number;
  status: string;
  createdAt: Date;
}

export class DailyMissionGenerator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async selectDailyMission(
    organizationId: string,
    projectId: string,
    auditId: string,
    candidates: DailyMissionCandidate[],
    constraints?: {
      maxTimeMinutes?: number;
      maxDifficultyLevel?: number;
      excludePageTypes?: string[];
      priorityPageIds?: string[];
    }
  ): Promise<DailyMissionCandidate | null> {
    // Filter candidates based on constraints
    let filtered = this.filterCandidates(candidates, constraints);

    if (filtered.length === 0) {
      return null;
    }

    // Score candidates based on impact vs effort
    const scored = filtered.map((candidate) => ({
      candidate,
      impactScore: this.calculateImpactScore(candidate),
    }));

    // Sort by impact score descending
    scored.sort((a, b) => b.impactScore - a.impactScore);

    // Return top candidate
    return scored[0].candidate;
  }

  private filterCandidates(
    candidates: DailyMissionCandidate[],
    constraints?: any
  ): DailyMissionCandidate[] {
    let filtered = [...candidates];

    // Filter by time constraint
    if (constraints?.maxTimeMinutes) {
      filtered = filtered.filter(
        (c) => c.estimatedTimeMinutes <= constraints.maxTimeMinutes
      );
    }

    // Filter by difficulty constraint
    if (constraints?.maxDifficultyLevel) {
      filtered = filtered.filter(
        (c) => c.difficulty <= constraints.maxDifficultyLevel
      );
    }

    // Exclude certain page types
    if (constraints?.excludePageTypes && constraints.excludePageTypes.length > 0) {
      filtered = filtered.filter(
        (c) => !constraints.excludePageTypes.includes(c.pageUrl.split('/').pop())
      );
    }

    // Prioritize specific pages
    if (constraints?.priorityPageIds && constraints.priorityPageIds.length > 0) {
      const priorityMap = new Map(
        constraints.priorityPageIds.map((id: string, index: number) => [
          id,
          constraints.priorityPageIds.length - index,
        ])
      );

      filtered.sort((a, b) => {
        const aPriority = priorityMap.get(a.pageId) || 0;
        const bPriority = priorityMap.get(b.pageId) || 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return 0;
      });
    }

    return filtered;
  }

  private calculateImpactScore(candidate: DailyMissionCandidate): number {
    // Impact score = (expected return × business value) / (difficulty × time)
    // This favors high-impact, quick wins

    const returnComponent = Math.max(1, candidate.expectedBusinessReturn);
    const businessValue = Math.max(1, candidate.businessValueScore);
    const effort = Math.max(1, candidate.difficulty * (candidate.estimatedTimeMinutes / 60));

    const impactScore = (returnComponent * businessValue) / effort;

    // Apply priority multiplier (top 10% get bonus)
    let multiplier = 1;
    if (candidate.priorityRank <= 5) multiplier = 1.5;
    else if (candidate.priorityRank <= 10) multiplier = 1.25;
    else if (candidate.priorityRank <= 20) multiplier = 1.1;

    return impactScore * multiplier;
  }

  async generateMission(
    organizationId: string,
    projectId: string,
    auditId: string,
    candidate: DailyMissionCandidate
  ): Promise<DailyMission> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reasoning = this.buildMissionReasoning(candidate);

    // Check if mission already exists for today
    const existing = await this.prisma.dailyMission.findUnique({
      where: {
        projectId_date: {
          projectId,
          date: today,
        },
      },
    });

    if (existing) {
      // Update existing mission for today
      await this.prisma.dailyMission.update({
        where: {
          projectId_date: {
            projectId,
            date: today,
          },
        },
        data: {
          pageUrl: candidate.pageUrl,
          recommendationType: candidate.recommendationType,
          reasoning,
          expectedReturn: JSON.stringify({
            businessValue: candidate.businessValueScore,
            seoOpportunity: candidate.seoOpportunityScore,
            combined: (
              (candidate.businessValueScore + candidate.seoOpportunityScore) /
              2
            ).toFixed(1),
          }),
          estimatedTime: candidate.estimatedTimeMinutes,
          difficulty: candidate.difficulty,
          status: 'active',
        },
      });
    } else {
      // Create new mission for today
      await this.prisma.dailyMission.create({
        data: {
          organizationId,
          projectId,
          date: today,
          pageUrl: candidate.pageUrl,
          recommendationType: candidate.recommendationType,
          reasoning,
          expectedReturn: JSON.stringify({
            businessValue: candidate.businessValueScore,
            seoOpportunity: candidate.seoOpportunityScore,
            combined: (
              (candidate.businessValueScore + candidate.seoOpportunityScore) /
              2
            ).toFixed(1),
          }),
          estimatedTime: candidate.estimatedTimeMinutes,
          difficulty: candidate.difficulty,
          status: 'active',
        },
      });
    }

    return {
      pageUrl: candidate.pageUrl,
      recommendationType: candidate.recommendationType,
      reasoning,
      expectedReturn: candidate.expectedBusinessReturn,
      estimatedTime: candidate.estimatedTimeMinutes,
      difficulty: candidate.difficulty,
      status: 'active',
      createdAt: new Date(),
    };
  }

  private buildMissionReasoning(candidate: DailyMissionCandidate): string {
    const reasons: string[] = [];

    // Reason 1: Impact potential
    if (candidate.expectedBusinessReturn > 1000) {
      reasons.push(
        `High-impact opportunity: ${candidate.recommendationType} on ${candidate.pageUrl}`
      );
    } else if (candidate.expectedBusinessReturn > 100) {
      reasons.push(
        `Moderate-impact opportunity: ${candidate.recommendationType} on ${candidate.pageUrl}`
      );
    } else {
      reasons.push(
        `Quick-win opportunity: ${candidate.recommendationType} on ${candidate.pageUrl}`
      );
    }

    // Reason 2: Business value
    if (candidate.businessValueScore > 70) {
      reasons.push(`Strong business value (${candidate.businessValueScore}/100)`);
    }

    // Reason 3: Effort
    if (candidate.estimatedTimeMinutes < 30) {
      reasons.push(`Achievable today (${candidate.estimatedTimeMinutes} minutes)`);
    } else if (candidate.estimatedTimeMinutes < 120) {
      reasons.push(
        `Can be completed this week (${candidate.estimatedTimeMinutes} minutes)`
      );
    }

    // Reason 4: Difficulty
    if (candidate.difficulty <= 3) {
      reasons.push('Low-difficulty implementation');
    }

    // Reason 5: Priority
    if (candidate.priorityRank <= 10) {
      reasons.push(`Top 10 priority page (rank #${candidate.priorityRank})`);
    } else if (candidate.priorityRank <= 50) {
      reasons.push(
        `High-priority page (rank #${candidate.priorityRank} out of peers)`
      );
    }

    // Reason 6: SEO opportunity
    if (candidate.seoOpportunityScore > 70) {
      reasons.push(
        `Major SEO opportunity unlocked (${candidate.seoOpportunityScore}/100)`
      );
    }

    return reasons.join('. ') + '.';
  }

  async completeMission(
    projectId: string,
    actualTimeMinutes: number,
    result: {
      completed: boolean;
      impact: string;
      notes?: string;
    }
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mission = await this.prisma.dailyMission.findUnique({
      where: {
        projectId_date: {
          projectId,
          date: today,
        },
      },
    });

    if (!mission) {
      throw new Error('No mission found for today');
    }

    return this.prisma.dailyMission.update({
      where: { id: mission.id },
      data: {
        status: result.completed ? 'completed' : 'skipped',
        completedAt: new Date(),
        actualTime: actualTimeMinutes,
        actualResult: JSON.stringify(result),
      },
    });
  }
}
