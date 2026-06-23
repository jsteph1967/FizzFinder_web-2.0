import { UserFinder } from '../types';
import { Award, CheckCircle2, Flame, RefreshCw, Trophy } from 'lucide-react';

interface LeaderboardProps {
  finders: UserFinder[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Leaderboard({ finders, onRefresh, isRefreshing }: LeaderboardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sans font-bold text-slate-900 text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500 fill-amber-100" />
            Top Spottter Leaderboard
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Community-ranked by verified soda spottings</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 hover:bg-slate-50 active:scale-95 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-100 transition-all cursor-pointer"
          title="Refresh rankings"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {finders.map((finder, idx) => {
          const isTopThree = idx < 3;
          const bgRank = idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-100 text-slate-600';
          const textRank = isTopThree ? 'text-white font-black' : 'text-slate-500 font-bold';

          return (
            <div
              key={finder.username}
              id={`leaderboard-user-${finder.username}`}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/50 transition-all duration-150"
            >
              <div className="flex items-center gap-3">
                {/* Visual Rank Tag */}
                <div className={`h-6 w-6 rounded-md flex items-center justify-center text-xs ${bgRank} ${textRank} shadow-xs`}>
                  {idx + 1}
                </div>

                {/* Avatar with beautiful gradient */}
                <div className={`h-9 w-9 rounded-full bg-gradient-to-tr ${finder.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                  {finder.username.substring(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-slate-800 font-sans">{finder.username}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {finder.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Flame className="h-3 w-3 text-orange-500" /> {finder.contributionsCount} spottings
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {finder.accuracyRate}% reliability
                    </span>
                  </div>
                </div>
              </div>

              {/* Reputation points tracker */}
              <div className="text-right">
                <div className="font-bold text-sm text-slate-900 font-mono flex items-center justify-end gap-1">
                  <Award className="h-4 w-4 text-indigo-500" />
                  {finder.reputationPoints}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-sans mt-0.5">Rep Points</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
        <strong className="text-slate-700">How to level up?</strong> Submit active spottings with correct, accurate shelves. Each companion <span className="font-bold text-emerald-600">"Spotted!" upvote</span> increases your reputation by +15, while <span className="font-bold text-rose-500">"Not There!" downvotes</span> reduce points.
      </div>
    </div>
  );
}
