import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface LiveResultsProps {
  voteResults: Record<string, number>;
  votingLogicConfig: any;
  ballotOptions?: string[];
}

export const LiveResults = ({ voteResults, votingLogicConfig, ballotOptions }: LiveResultsProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if this is ranked voting results
  const isRankedVoting = voteResults && 'winner' in voteResults && 'rounds' in voteResults;

  const chartData = useMemo(() => {
    if (isRankedVoting) return [];
    const options = ballotOptions || Object.keys(voteResults);
    return options.map(option => ({
      name: option,
      votes: voteResults[option] || 0,
    })).sort((a, b) => b.votes - a.votes);
  }, [voteResults, ballotOptions, isRankedVoting]);

  const totalVotes = useMemo(() => {
    if (isRankedVoting) return voteResults.total_ballots || 0;
    return Object.values(voteResults).reduce((sum, votes) => sum + (votes as number), 0);
  }, [voteResults, isRankedVoting]);

  const potentialWinner = useMemo(() => {
    if (isRankedVoting) {
      const winner = voteResults.winner;
      const finalVoteCount = voteResults.final_vote_count || 0;
      const rounds = Array.isArray(voteResults.rounds) ? voteResults.rounds : [];
      if (winner) {
        return {
          choice: winner,
          reason: `Winner after ${rounds.length} rounds with ${finalVoteCount} votes`,
          isCertain: true,
        };
      }
      return null;
    }

    if (chartData.length === 0) return null;

    const winningCriteria = votingLogicConfig?.winningCriteria || 'plurality';
    const topChoice = chartData[0];

    switch (winningCriteria) {
      case 'majority':
        // Need more than 50% of votes
        if (topChoice.votes > totalVotes / 2) {
          return {
            choice: topChoice.name,
            reason: `Has ${topChoice.votes} votes (${((topChoice.votes / totalVotes) * 100).toFixed(1)}% - Majority)`,
            isCertain: true,
          };
        } else {
          return {
            choice: topChoice.name,
            reason: `Leading with ${topChoice.votes} votes (${((topChoice.votes / totalVotes) * 100).toFixed(1)}% - Needs majority)`,
            isCertain: false,
          };
        }
      
      case 'supermajority':
        // Need 2/3 or more of votes
        if (topChoice.votes >= (totalVotes * 2) / 3) {
          return {
            choice: topChoice.name,
            reason: `Has ${topChoice.votes} votes (${((topChoice.votes / totalVotes) * 100).toFixed(1)}% - Supermajority)`,
            isCertain: true,
          };
        } else {
          return {
            choice: topChoice.name,
            reason: `Leading with ${topChoice.votes} votes (${((topChoice.votes / totalVotes) * 100).toFixed(1)}% - Needs supermajority)`,
            isCertain: false,
          };
        }
      
      case 'plurality':
      default:
        // Most votes wins
        return {
          choice: topChoice.name,
          reason: `Leading with ${topChoice.votes} votes (${((topChoice.votes / totalVotes) * 100).toFixed(1)}%)`,
          isCertain: topChoice.votes > 0,
        };
    }
  }, [chartData, totalVotes, votingLogicConfig, isRankedVoting, voteResults]);

  if (totalVotes === 0) {
    return (
      <Card className="p-8 text-center border-border/50 bg-card/40 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted/50">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">No Votes Yet</h3>
            <p className="text-muted-foreground">Results will appear here once voting begins</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Live Results</h2>
            <p className="text-sm text-muted-foreground">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast</p>
          </div>
        </div>

        {/* Potential Winner - Always Visible */}
        {potentialWinner && (
          <div className={`p-4 rounded-xl border ${
            potentialWinner.isCertain 
              ? 'bg-primary/10 border-primary/30' 
              : 'bg-muted/50 border-border/50'
          }`}>
            <div className="flex items-start gap-3">
              <Trophy className={`w-5 h-5 mt-0.5 ${
                potentialWinner.isCertain ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {potentialWinner.isCertain ? 'Current Winner' : 'Leading Choice'}
                </h3>
                <p className="text-lg font-bold text-primary mb-1">{potentialWinner.choice}</p>
                <p className="text-sm text-muted-foreground">{potentialWinner.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                Hide Details
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show More Details
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Detailed Results Table - Collapsible */}
        {isExpanded && (
          <div className="space-y-2 mt-6 animate-accordion-down">
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
              {isRankedVoting ? t('vote.eliminationRounds') : 'Detailed Breakdown'}
            </h3>
            
            {isRankedVoting ? (
              /* Ranked Choice Elimination Rounds */
              <div className="space-y-4">
                {Array.isArray(voteResults.rounds) && voteResults.rounds.map((round: any, roundIndex: number) => {
                  const tallies = round.tallies || {};
                  const eliminated = round.eliminated;
                  const sortedOptions = Object.entries(tallies).sort((a: any, b: any) => b[1] - a[1]);
                  
                  return (
                    <div key={roundIndex} className="p-4 rounded-lg bg-muted/20 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">
                          Round {round.round}
                        </h4>
                        {eliminated && (
                          <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Eliminated: {eliminated}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {sortedOptions.map(([option, votes]: any, idx: number) => {
                          const isEliminated = option === eliminated;
                          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                          
                          return (
                            <div key={option} className={`p-2 rounded ${isEliminated ? 'opacity-50' : ''}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{option}</span>
                                <span className="text-sm">
                                  {votes} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full smooth-transition ${
                                    idx === 0 ? 'bg-primary' : 'bg-accent'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Standard Vote Breakdown */
              <>
                {chartData.map((item, index) => {
                  const percentage = totalVotes > 0 ? (item.votes / totalVotes) * 100 : 0;
                  return (
                    <div 
                      key={item.name}
                      className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 smooth-transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="w-4 h-4 text-primary" />}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{item.votes}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full smooth-transition ${
                            index === 0 ? 'bg-primary' : 'bg-accent'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
